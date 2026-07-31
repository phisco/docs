---
title: Create a composition with Go
sidebar_position: 1
description: Use Go to create resources with your control plane.
aliases:
    - /core-concepts/authoring-compositions
---

Upbound Crossplane allows you to choose how you want to write your composition logic based on your preferred language.

You can choose:

**Go (this guide)** - High performance. IDE support with full type safety.

[Go Templating][go-templates] - Good for YAML-like configurations. IDE support with YAML
language server.

[KCL][kcl] - Concise. Good for transitioning from another configuration language
like `HCL`. IDE support with language server.

[Python][python] - Highly accessible, supports complex logic. Provides type hints and
autocompletion in your IDE.

<!-- vale gitlab.HeadingContent = NO -->
## Overview
<!-- vale gitlab.HeadingContent = YES -->

This guide explains how to create compositions that turn your XRs into actual
cloud resources. Compositions allow you to implement the business logic that
powers your control plane.

Use this guide after you define your API schema and need to write the logic that creates and manages the underlying resources.

:::important
This guide assumes you're familiar with Go. If you'd like to become more
familiar with Go, the [official tutorials][official-tutorials] are a good place
to start.
:::

## Prerequisites

Before you begin, make sure:

<!-- vale write-good.Passive = NO -->
* You designed your XRD
* You've added provider dependencies
* You understand your XRD schema and what resources you need to create
* Go is installed
* Go Visual Studio Code extension is installed
<!-- vale write-good.Passive = YES -->

## Create your composition scaffold

Use the XRD you created in the previous step to generate a new composition:

```shell
up composition generate apis/<your_resource_name>/definition.yaml
```

This command creates `apis/<your_resource_name>/composition.yaml` which references the XRD.

## Generate your function

Use your chosen programming language to generate a new function:

```shell
up function generate --language=go compose-resources
apis/<your_resource_name>/composition.yaml
```

This command creates a `functions/compose-resources` directory with your function code and updates your composition file to reference it.

Below is an example function file in `functions/compose-resources/fn.go`:
```go
package main

import (
	"context"

	"github.com/crossplane/function-sdk-go/errors"
	"github.com/crossplane/function-sdk-go/logging"
	fnv1 "github.com/crossplane/function-sdk-go/proto/v1"
	"github.com/crossplane/function-sdk-go/response"
)

// Function is your composition function.
type Function struct {
	fnv1.UnimplementedFunctionRunnerServiceServer

	log logging.Logger
}

// RunFunction runs the Function.
func (f *Function) RunFunction(_ context.Context, req *fnv1.RunFunctionRequest) (*fnv1.RunFunctionResponse, error) {
	// Your business logic goes here
}
```

## Create your function logic

The following example function composes an S3 bucket based on a simplified bucket XRD:

:::tip
The generated model type name matches your XRD's `kind` exactly. This example
assumes a `v2` XRD (`apiextensions.crossplane.io/v2`) with `kind: StorageBucket`.
If your XRD uses the legacy `v1` API (`apiextensions.crossplane.io/v1`), your
XRD's `kind` uses an `X` prefix, for example `kind: XStorageBucket`, so import
`v1alpha1.XStorageBucket` instead.
:::

```go
package main

import (
	"context"
	"encoding/json"

	"dev.upbound.io/models/com/example/platform/v1alpha1"
	"dev.upbound.io/models/io/upbound/aws/s3/v1beta1"
	"k8s.io/utils/ptr"

	"github.com/crossplane/function-sdk-go/errors"
	"github.com/crossplane/function-sdk-go/logging"
	fnv1 "github.com/crossplane/function-sdk-go/proto/v1"
	"github.com/crossplane/function-sdk-go/request"
	"github.com/crossplane/function-sdk-go/resource"
	"github.com/crossplane/function-sdk-go/resource/composed"
	"github.com/crossplane/function-sdk-go/response"
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

	var xr v1alpha1.StorageBucket
	if err := convertViaJSON(&xr, observedComposite.Resource); err != nil {
		response.Fatal(rsp, errors.Wrap(err, "cannot convert xr"))
		return rsp, nil
	}

	params := xr.Spec.Parameters
	if ptr.Deref(params.Region, "") == "" {
		response.Fatal(rsp, errors.Wrap(err, "missing region"))
		return rsp, nil
	}

	bucket := &v1beta1.Bucket{
		APIVersion: ptr.To(v1beta1.BucketAPIVersions3AwsUpboundIoV1Beta1),
		Kind:       ptr.To(v1beta1.BucketKindBucket),
		Spec: &v1beta1.BucketSpec{
			ForProvider: &v1beta1.BucketSpecForProvider{
				Region: params.Region,
			},
		},
	}

	desiredComposedResources, err := request.GetDesiredComposedResources(req)
	if err != nil {
		response.Fatal(rsp, errors.Wrap(err, "cannot get desired resources"))
		return rsp, nil
	}

	c := composed.New()
	if err := convertViaJSON(c, bucket); err != nil {
		response.Fatal(rsp, errors.Wrap(err, "cannot convert bucket to unstructured"))
		return rsp, nil
	}
	desiredComposedResources["bucket"] = &resource.DesiredComposed{Resource: c}

	if err := response.SetDesiredComposedResources(rsp, desiredComposedResources); err != nil {
		response.Fatal(rsp, errors.Wrap(err, "cannot set desired resources"))
		return rsp, nil
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
```

<details>

<summary>A more advanced Go function</summary>

The function `fn.go` file below takes a composite resource (XR) as input and produces managed resources (MRs) from the [S3 provider][s3-provider] based on its parameters.

The function always composes an S3 bucket. When the S3 bucket exists, it also composes a bucket access control list (ACL). The ACL references the bucket by name.

If the composite resource's `spec.versioning` field is `true`, the function enables versioning by composing a bucket versioning configuration. Like the ACL, the versioning configuration references the bucket by name.

```go
package main

import (
	"context"
	"encoding/json"

	"dev.upbound.io/models/com/example/platform/v1alpha1"
	"dev.upbound.io/models/io/upbound/aws/s3/v1beta1"
	"github.com/crossplane/function-sdk-go/errors"
	"github.com/crossplane/function-sdk-go/logging"
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

	var xr v1alpha1.StorageBucket
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
```

</details>

## Work with models

Upbound Official Providers and some other packages include Go models: packages containing struct type definitions for their resources. These models enable in-line documentation, linting, autocompletion, and other features when working with Crossplane resources in embedded Go functions.

### Make models available to a function

Use `up dependency add` to make models from a dependency available to a function. Dependencies are most often Crossplane providers, but they can also be configurations that include XRDs.

```console
up dependency add xpkg.upbound.io/upbound/provider-aws-s3:v1.20.0
```

Use `up project build` to make models available for XRDs defined by your project.

```console
up project build
```

:::tip
`up` caches Go models in the `.up/go` directory, at the root of your project. You shouldn't commit the `.up` directory to source control.
:::

### Import models into a function

Each provider's models are available in their own packages, named after the provider's resource group and versions. The model packages are all contained in a single Go module with the path `dev.upbound.io/models`. Note that you always import this module through a `replace` directive in the `go.mod` file. Go tooling can't resolve it otherwise.

Import models to your `fn.go` function file with the following syntax:

```go
import "dev.upbound.io/models/io/upbound/aws/s3/v1alpha1"
```

### Field types in models

All fields in Upbound's Go models have pointer types so that you can specify
only the fields your function has an opinion about. This can be awkward in Go,
since there's no built-in way to construct a pointer to a constant value. You
can use the `k8s.io/utils/ptr` package function, `ptr.To` for
this purpose:

```go
bucket := &v1beta1.Bucket{
	APIVersion: ptr.To(v1beta1.BucketAPIVersions3AwsUpboundIoV1Beta1),
	Kind:       ptr.To(v1beta1.BucketKindBucket),
	Spec: &v1beta1.BucketSpec{
		ForProvider: &v1beta1.BucketSpecForProvider{
			Region: ptr.To("us-east-1"),
		},
	},
}
```

## Handle inputs and outputs

Crossplane sends requests to your functions to ask them what resources to compose for a given composite resource (XR). Your function answers with a response.

:::tip
The examples on this page convert between generated model types and protobuf structs using a helper function called `convertViaJSON`. You can find this function's definition in the examples above.
:::

### Inputs

Compositions execute a pipeline of one or more sequential functions. A function updates desired resource state and returns it to Crossplane. Function requests contain four pieces of information:

1. The observed state of the composite resource, and any composed resources.
2. The desired state of the composite resource, and any composed resources.
3. The function's input.
4. The function pipeline's context.

Each composition pipeline provides this information as _inputs_ into the function.

Crossplane passes these pieces of information to the function as part of the `req *fnv1.RunFunctionRequest` argument:

```go
package main

import (
	fnv1 "github.com/crossplane/function-sdk-go/proto/v1"
	"github.com/crossplane/function-sdk-go/request"
)

// Function is your composition function.
type Function struct {
	fnv1.UnimplementedFunctionRunnerServiceServer
}

// RunFunction runs the Function.
func (f *Function) RunFunction(_ context.Context, req *fnv1.RunFunctionRequest) (*fnv1.RunFunctionResponse, error) {
	observedComposite, _ := request.GetObservedCompositeResource(req) // Observed XR
	observedComposed, _ := request.GetObservedComposedResources(req)  // Observed composed resources
	desiredComposite, _ := request.GetDesiredCompositeResource(req)   // Desired XR
	desiredComposed, _ := request.GetDesiredComposedResources(req)    // Desired composed resources

	var input MyInputType                                             // Function input
	_ = request.GetInput(req, &input)

	ctxItem, _ := request.GetContextKey(req, "some-context")          // Function pipeline context
	extra, _ := request.GetExtraResources(req)                        // Any extra resources the function pipeline requested
}
```

:::tip
You can select the `RunFunctionRequest` object in Visual Studio Code to see what fields it has.

The Go function SDK generates the `RunFunctionRequest` object from a protobuf definition. Read the [Go Generated Code Guide][go-generated-code-guide] to learn about protobuf generated code.
:::

Most functions reference the observed composite resource (XR) to produce composed resources, typically managed resources (MRs). In Go, you can extract the observed XR from the request with `request.GetObservedCompositeResource`.

When you generate an embedded function with `up function generate`, the command creates a Go library that includes type definitions based on your XRDs. You can use these generated types by converting the protobuf struct to JSON and then unmarshaling it into your XR type:

```go
observedComposite, err := request.GetObservedCompositeResource(req)
if err != nil {
	response.Fatal(rsp, errors.Wrap(err, "cannot get xr"))
	return rsp, nil
}

var xr v1alpha1.StorageBucket
if err := convertViaJSON(&xr, observedComposite.Resource); err != nil {
	response.Fatal(rsp, errors.Wrap(err, "cannot convert xr"))
	return rsp, nil
}
```

After this, Visual Studio Code adds tab-completion and type checking when working with the XR.

### Outputs

Composition functions influence the state of the control plane via three kinds of outputs:

<!-- vale write-good.TooWordy = NO -->
1. The desired state of the composite resource, and composed resources.
2. Status conditions to apply to the composite resource and, optionally, its claim.
3. Context to pass to subsequent functions in the pipeline.
<!-- vale write-good.TooWordy = YES -->

Most functions produce a set of composed resources as part of the desired state.

In Go, outputs are part of the `rsp *fnv1.RunFunctionResponse` return value. You can construct a response pre-populated with the request's desired state and context using the `response.To` function. A Go function only needs to update any fields in the response that it wishes to change.

:::tip
You can select the `RunFunctionResponse` object in Visual Studio Code to see what fields it has.

The Go function SDK generates the `RunFunctionResponse` object from a protobuf definition. Read the [Go Generated Code Guide][go-generated-code-guide-1] to learn about protobuf generated code.
:::

You can add or update composed resources using the `response.SetDesiredComposedResources` helper function in the Crossplane Go SDK:

```go
c := composed.New()
if err := convertViaJSON(c, bucket); err != nil {
	response.Fatal(rsp, errors.Wrap(err, "cannot convert bucket to unstructured"))
	return rsp, nil
}
desiredComposedResources["bucket"] = &resource.DesiredComposed{Resource: c}

if err := response.SetDesiredComposedResources(rsp, desiredComposedResources); err != nil {
	response.Fatal(rsp, errors.Wrap(err, "cannot set desired resources"))
	return rsp, nil
}
```

Similarly, you can update the status of the composite resource by updating it in the response with the `response.SetDesiredCompositeResource` helper function:

```go
xr.Status.SomeInformation = ptr.To("cool-status")
desiredComposite := composite.New()
if err := convertViaJSON(&desiredComposite.Unstructured, &xr); err != nil {
	response.Fatal(rsp, errors.Wrap(err, "cannot convert desired composite"))
	return rsp, nil
}

if err := response.SetDesiredCompositeResource(rsp, &resource.Composite{Resource: desiredComposite}); err != nil {
	response.Fatal(rsp, errors.Wrap(err, "cannot set desired composite"))
	return
}
```

## See also

* [Go Language Documentation][go] - Official Go documentation
* [Official Go Tutorials][official-tutorials] - Learn Go fundamentals
* [Crossplane Go SDK Documentation][crossplane-go-sdk-documentation] - Complete SDK reference
* [Go Generated Code Guide][go-generated-code-guide] - Understanding protobuf generated code

<!-- [go]: /manuals/cli/projects/compositions/go -->
[go-templates]: /manuals/cli/howtos/compositions/go-template
[kcl]: /manuals/cli/howtos/compositions/kcl
[python]: /manuals/cli/howtos/compositions/python
[go]: https://www.golang.org
[official-tutorials]: https://go.dev/learn/
[s3-provider]: https://marketplace.upbound.io/providers/upbound/provider-aws-s3
[crossplane-go-sdk-documentation]: https://pkg.go.dev/github.com/crossplane/function-sdk-go
[go-generated-code-guide]: https://protobuf.dev/reference/go/go-generated/
[go-generated-code-guide-1]: https://protobuf.dev/reference/go/go-generated/
