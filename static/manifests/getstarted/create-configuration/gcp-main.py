from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

from .model.io.upbound.m.gcp.storage.bucket import v1beta1 as mbucketv1beta1
from .model.io.upbound.m.gcp.storage.bucketacl import v1beta1 as maclv1beta1
from .model.com.example.platform.storagebucket import v1alpha1

def resource_name(xr, resource):
    return "{}-{}".format(xr.metadata.name, resource)

def default_metadata(name):
    return {
        "name": name
    }

def compose(req: fnv1.RunFunctionRequest, rsp: fnv1.RunFunctionResponse):
    observed_xr = v1alpha1.StorageBucket(**req.observed.composite.resource)
    params = observed_xr.spec.parameters

    # Create GCP Bucket
    desired_bucket = mbucketv1beta1.Bucket(
        metadata = default_metadata(resource_name(observed_xr, "bucket")),
        spec = mbucketv1beta1.Spec(
            forProvider = mbucketv1beta1.ForProvider(
                location = params.location,
                versioning = {
                    "enabled": params.versioning
                }
            ),
        ),
    )
    resource.update(rsp.desired.resources["bucket"], desired_bucket)

    # Bucket ACL
    desired_acl = maclv1beta1.BucketACL(
        metadata = default_metadata(resource_name(observed_xr, "acl")),
        spec = maclv1beta1.Spec(
            forProvider = maclv1beta1.ForProvider(
                predefinedAcl=params.acl,
                bucketSelector = maclv1beta1.BucketSelector(matchControllerRef = True)
            ),
        ),
    )
    resource.update(rsp.desired.resources["acl"], desired_acl)
