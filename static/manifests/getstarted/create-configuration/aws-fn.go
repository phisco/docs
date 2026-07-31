package main

import (
	"context"
	"encoding/json"

	"dev.upbound.io/models/com/example/platform/v1alpha1"
	"dev.upbound.io/models/io/upbound/aws/s3/v1beta1"
	"github.com/crossplane/crossplane-runtime/pkg/logging"
	"github.com/crossplane/function-sdk-go/errors"
	fnv1 "github.com/crossplane/function-sdk-go/proto/v1"
	"github.com/crossplane/function-sdk-go/request"
	"github.com/crossplane/function-sdk-go/resource"
	"github.com/crossplane/function-sdk-go/resource/composed"
	"github.com/crossplane/function-sdk-go/response"
	"k8s.io/utils/ptr"
)

// Function is your composition function.
type Function struct {
	fnv1.UnimplementedFunctionRunnerServiceServer

	log logging.Logger
}

// RunFunction runs the Function.
func (f *Function) RunFunction(_ context.Context, req *fnv1.RunFunctionRequest) (*fnv1.RunFunctionResponse, error) {
	f.log.Info("Running function", "tag", req.GetMeta().GetTag())
	rsp := response.To(req, response.DefaultTTL)

	observedComposite, err := request.GetObservedCompositeResource(req)
	if err != nil {
		response.Fatal(rsp, errors.Wrap(err, "cannot get xr"))
		return rsp, nil
	}

	observedComposed, err := request.GetObservedComposedResources(req)
	if err != nil {
		response.Fatal(rsp, errors.Wrap(err, "cannot get observed resources"))
		return rsp, nil
	}

	var xr v1alpha1.XStorageBucket
	if err := convertViaJSON(&xr, observedComposite.Resource); err != nil {
		response.Fatal(rsp, errors.Wrap(err, "cannot convert xr"))
		return rsp, nil
	}

	params := xr.Spec.Parameters
	if params.Region == nil || *params.Region == "" {
		response.Fatal(rsp, errors.Wrap(err, "missing region"))
		return rsp, nil
	}

	// We'll collect our desired composed resources into this map, then convert
	// them to the SDK's types and set them in the response when we return.
	desiredComposed := make(map[resource.Name]any)
	defer func() {
		desiredComposedResources, err := request.GetDesiredComposedResources(req)
		if err != nil {
			response.Fatal(rsp, errors.Wrap(err, "cannot get desired resources"))
			return
		}

		for name, obj := range desiredComposed {
			c := composed.New()
			if err := convertViaJSON(c, obj); err != nil {
				response.Fatal(rsp, errors.Wrapf(err, "cannot convert %s to unstructured", name))
				return
			}
			desiredComposedResources[name] = &resource.DesiredComposed{Resource: c}
		}

		if err := response.SetDesiredComposedResources(rsp, desiredComposedResources); err != nil {
			response.Fatal(rsp, errors.Wrap(err, "cannot set desired resources"))
			return
		}
	}()

	bucket := &v1beta1.Bucket{
		APIVersion: ptr.To(v1beta1.BucketAPIVersions3AwsUpboundIoV1Beta1),
		Kind:       ptr.To(v1beta1.BucketKindBucket),
		Spec: &v1beta1.BucketSpec{
			ForProvider: &v1beta1.BucketSpecForProvider{
				Region: params.Region,
			},
		},
	}
	desiredComposed["bucket"] = bucket

	// Return early if Crossplane hasn't observed the bucket yet. This means it
	// hasn't been created yet. This function will be called again after it is.
	observedBucket, ok := observedComposed["bucket"]
	if !ok {
		response.Normal(rsp, "waiting for bucket to be created").TargetCompositeAndClaim()
		return rsp, nil
	}

	// The desired ACL, encryption, and versioning resources all need to refer
	// to the bucket by its external name, which is stored in its external name
	// annotation. Return early if the Bucket's external-name annotation isn't
	// set yet.
	bucketExternalName := observedBucket.Resource.GetAnnotations()["crossplane.io/external-name"]
	if bucketExternalName == "" {
		response.Normal(rsp, "waiting for bucket to be created").TargetCompositeAndClaim()
		return rsp, nil
	}

	acl := &v1beta1.BucketACL{
		APIVersion: ptr.To(v1beta1.BucketACLApiVersions3AwsUpboundIoV1Beta1),
		Kind:       ptr.To(v1beta1.BucketACLKindBucketACL),
		Spec: &v1beta1.BucketACLSpec{
			ForProvider: &v1beta1.BucketACLSpecForProvider{
				Bucket: &bucketExternalName,
				Region: params.Region,
				ACL:    params.ACL,
			},
		},
	}
	desiredComposed["acl"] = acl

	boc := &v1beta1.BucketOwnershipControls{
		APIVersion: ptr.To(v1beta1.BucketOwnershipControlsAPIVersions3AwsUpboundIoV1Beta1),
		Kind:       ptr.To(v1beta1.BucketOwnershipControlsKindBucketOwnershipControls),
		Spec: &v1beta1.BucketOwnershipControlsSpec{
			ForProvider: &v1beta1.BucketOwnershipControlsSpecForProvider{
				Bucket: &bucketExternalName,
				Region: params.Region,
				Rule: &[]v1beta1.BucketOwnershipControlsSpecForProviderRuleItem{{
					ObjectOwnership: ptr.To("BucketOwnerPreferred"),
				}},
			},
		},
	}
	desiredComposed["boc"] = boc

	pab := &v1beta1.BucketPublicAccessBlock{
		APIVersion: ptr.To(v1beta1.BucketPublicAccessBlockAPIVersions3AwsUpboundIoV1Beta1),
		Kind:       ptr.To(v1beta1.BucketPublicAccessBlockKindBucketPublicAccessBlock),
		Spec: &v1beta1.BucketPublicAccessBlockSpec{
			ForProvider: &v1beta1.BucketPublicAccessBlockSpecForProvider{
				Bucket:                &bucketExternalName,
				Region:                params.Region,
				BlockPublicAcls:       ptr.To(false),
				RestrictPublicBuckets: ptr.To(false),
				IgnorePublicAcls:      ptr.To(false),
				BlockPublicPolicy:     ptr.To(false),
			},
		},
	}
	desiredComposed["pab"] = pab

	sse := &v1beta1.BucketServerSideEncryptionConfiguration{
		APIVersion: ptr.To(v1beta1.BucketServerSideEncryptionConfigurationAPIVersions3AwsUpboundIoV1Beta1),
		Kind:       ptr.To(v1beta1.BucketServerSideEncryptionConfigurationKindBucketServerSideEncryptionConfiguration),
		Spec: &v1beta1.BucketServerSideEncryptionConfigurationSpec{
			ForProvider: &v1beta1.BucketServerSideEncryptionConfigurationSpecForProvider{
				Bucket: &bucketExternalName,
				Region: params.Region,
				Rule: &[]v1beta1.BucketServerSideEncryptionConfigurationSpecForProviderRuleItem{{
					ApplyServerSideEncryptionByDefault: &[]v1beta1.BucketServerSideEncryptionConfigurationSpecForProviderRuleItemApplyServerSideEncryptionByDefaultItem{{
						SseAlgorithm: ptr.To("AES256"),
					}},
					BucketKeyEnabled: ptr.To(true),
				}},
			},
		},
	}
	desiredComposed["sse"] = sse

	if params.Versioning != nil && *params.Versioning {
		versioning := &v1beta1.BucketVersioning{
			APIVersion: ptr.To(v1beta1.BucketVersioningAPIVersions3AwsUpboundIoV1Beta1),
			Kind:       ptr.To(v1beta1.BucketVersioningKindBucketVersioning),
			Spec: &v1beta1.BucketVersioningSpec{
				ForProvider: &v1beta1.BucketVersioningSpecForProvider{
					Bucket: &bucketExternalName,
					Region: params.Region,
					VersioningConfiguration: &[]v1beta1.BucketVersioningSpecForProviderVersioningConfigurationItem{{
						Status: ptr.To("Enabled"),
					}},
				},
			},
		}
		desiredComposed["versioning"] = versioning
	}

	return rsp, nil
}

func convertViaJSON(to, from any) error {
	bs, err := json.Marshal(from)
	if err != nil {
		return err
	}
	return json.Unmarshal(bs, to)
}
