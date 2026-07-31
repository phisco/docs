from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

from .model.io.k8s.apimachinery.pkg.apis.meta import v1 as metav1
from .model.com.example.platform.storagebucket import v1alpha1
from .model.io.upbound.m.aws.s3.bucket import v1beta1 as mbucketv1beta1
from .model.io.upbound.m.aws.s3.bucketacl import v1beta1 as maclv1beta1
from .model.io.upbound.m.aws.s3.bucketownershipcontrols import v1beta1 as mbocv1beta1
from .model.io.upbound.m.aws.s3.bucketpublicaccessblock import v1beta1 as mpabv1beta1
from .model.io.upbound.m.aws.s3.bucketversioning import v1beta1 as mverv1beta1
from .model.io.upbound.m.aws.s3.bucketserversideencryptionconfiguration import v1beta1 as mssev1beta1

def resource_name(xr, resource):
    return "{}-{}".format(xr.metadata.name, resource)

def default_metadata(name):
    return {
        "generateName": name
    }

def compose(req: fnv1.RunFunctionRequest, rsp: fnv1.RunFunctionResponse):
    observed_xr = v1alpha1.StorageBucket(**req.observed.composite.resource)
    params = observed_xr.spec.parameters

    # Create S3 Bucket
    desired_bucket = mbucketv1beta1.Bucket(
        metadata = default_metadata(resource_name(observed_xr, "bucket")),
        spec = mbucketv1beta1.Spec(
            forProvider = mbucketv1beta1.ForProvider(
                region = params.region,
            ),
        ),
    )
    resource.update(rsp.desired.resources["bucket"], desired_bucket)

    # Bucket BOC
    desired_boc = mbocv1beta1.BucketOwnershipControls(
        metadata = default_metadata(resource_name(observed_xr, "boc")),
        spec = mbocv1beta1.Spec(
            forProvider = mbocv1beta1.ForProvider(
                region = params.region,
                bucketSelector = mbocv1beta1.BucketSelector(matchControllerRef = True),
                rule = {
                    "objectOwnership": "BucketOwnerPreferred"
                }
            )
        ),
    )
    resource.update(rsp.desired.resources["boc"], desired_boc)

    # Bucket PAB
    desired_pab = mpabv1beta1.BucketPublicAccessBlock(
        metadata = default_metadata(resource_name(observed_xr, "pab")),
        spec=mpabv1beta1.Spec(
            forProvider = mpabv1beta1.ForProvider(
                region = params.region,
                bucketSelector = mpabv1beta1.BucketSelector(matchControllerRef = True),
                blockPublicAcls = False,
                ignorePublicAcls = False,
                restrictPublicBuckets = False,
                blockPublicPolicy = False,
            )
        ),
    )
    resource.update(rsp.desired.resources["pab"], desired_pab)

    # Bucket ACL
    desired_acl = maclv1beta1.BucketACL(
        metadata = default_metadata(resource_name(observed_xr, "acl")),
        spec = maclv1beta1.Spec(
            forProvider = maclv1beta1.ForProvider(
                region = params.region,
                bucketSelector = maclv1beta1.BucketSelector(matchControllerRef = True),
                acl = params.acl,
            ),
        ),
    )
    resource.update(rsp.desired.resources["acl"], desired_acl)

    # Default encryption for the bucket
    desired_sse = mssev1beta1.BucketServerSideEncryptionConfiguration(
        metadata = default_metadata(resource_name(observed_xr, "encryption")),
        spec = mssev1beta1.Spec(
            forProvider = mssev1beta1.ForProvider(
                region = params.region,
                bucketSelector = mssev1beta1.BucketSelector(matchControllerRef = True),
                rule = [
                    mssev1beta1.RuleItem(
                        applyServerSideEncryptionByDefault = {
                            "sseAlgorithm": "AES256"
                        },
                        bucketKeyEnabled = True
                    )
                ]
            ),
        ),
    )
    resource.update(rsp.desired.resources["sse"], desired_sse)

    # Set up versioning for the bucket if desired
    if params.versioning:
        desired_versioning = mverv1beta1.BucketVersioning(
            metadata = default_metadata(resource_name(observed_xr, "versioning")),
            spec = mverv1beta1.Spec(
                forProvider = mverv1beta1.ForProvider(
                    region = params.region,
                    bucketSelector = mverv1beta1.BucketSelector(matchControllerRef = True),
                    versioningConfiguration = {
                        "status": "Enabled"
                    }
                ),
            ),
        )
        resource.update(rsp.desired.resources["versioning"], desired_versioning)
