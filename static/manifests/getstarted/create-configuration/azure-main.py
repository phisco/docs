import re

from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

from .model.io.k8s.apimachinery.pkg.apis.meta import v1 as metav1
from .model.io.upbound.m.azure.resourcegroup import v1beta1 as rgv1beta1
from .model.io.upbound.m.azure.storage.account import v1beta1 as acctv1beta1
from .model.io.upbound.m.azure.storage.container import v1beta1 as contv1beta1
from .model.com.example.platform.storagebucket import v1alpha1

def resource_name(xr, resource):
    return "{}-{}".format(xr.metadata.name, resource)

def default_metadata(name):
    return {
        "name": name
    }

def sanitize_azure_storage_account_name(account_name):
    # Due to Azure's naming restrictions, storage account names must
    # be between 3-24 characters in length and use numbers and lower-case letters only

    # Convert to lowercase and remove all non-alphanumeric characters
    sanitized = re.sub(r'[^a-z0-9]', '', account_name.lower())

    # Ensure minimum length of 3
    if len(sanitized) < 3:
        sanitized = sanitized.ljust(3, '0')

    # Ensure maximum length of 24
    if len(sanitized) > 24:
        sanitized = sanitized[:24]

    return sanitized

def compose(req: fnv1.RunFunctionRequest, rsp: fnv1.RunFunctionResponse):
    observed_xr = v1alpha1.StorageBucket(**resource.struct_to_dict(req.observed.composite.resource))
    params = observed_xr.spec.parameters

    desired_group = rgv1beta1.ResourceGroup(
        metadata = default_metadata(resource_name(observed_xr, "group")),
        spec = rgv1beta1.Spec(
            forProvider = rgv1beta1.ForProvider(
                location = params.location,
            ),
        ),
    )
    resource.update(rsp.desired.resources["group"], desired_group)

    desired_acct = acctv1beta1.Account(
        metadata = default_metadata(sanitize_azure_storage_account_name(resource_name(observed_xr, "account"))),
        spec = acctv1beta1.Spec(
            forProvider = acctv1beta1.ForProvider(
                accountTier = "Standard",
                accountReplicationType = "LRS",
                location = params.location,
                infrastructureEncryptionEnabled = True,
                blobProperties = {
                    "versioningEnabled": params.versioning
                },
                resourceGroupNameSelector = acctv1beta1.ResourceGroupNameSelector(matchControllerRef = True)
            ),
        ),
    )
    resource.update(rsp.desired.resources["account"], desired_acct)

    desired_cont = contv1beta1.Container(
        metadata = default_metadata(resource_name(observed_xr, "container")),
        spec = contv1beta1.Spec(
            forProvider = contv1beta1.ForProvider(
                containerAccessType = "blob" if params.acl == "public" else "private",
                storageAccountNameSelector = contv1beta1.StorageAccountNameSelector(matchControllerRef = True)
            ),
        ),
    )
    resource.update(rsp.desired.resources["container"], desired_cont)
