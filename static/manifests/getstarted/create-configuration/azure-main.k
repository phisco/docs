import regex
import models.io.upbound.azurem.v1beta1 as azuremv1beta1
import models.io.upbound.azurem.storage.v1beta1 as azuremstoragev1beta1

oxr = option("params").oxr      # observed composite resource
params = oxr.spec.parameters    # extract parameter values from XR
xr_metadata = oxr.metadata      # store XR metadata

_metadata = lambda name: str -> any {
    {
        name = name
        annotations = {
            "krm.kcl.dev/composition-resource-name" = name
        }
    }
}

sanitize_azure_storage_account_name = lambda name: str -> str {
    # Due to Azure's naming restrictions, storage account names must
    # be between 3-24 characters in length and use numbers and lower-case letters only

    # lower string and remove illegal characters
    sanitized = name.lower()
    sanitized = regex.replace(sanitized, "[^a-z0-9]", "")

    # pad with 0s if string name less than 3 characters
    if len(sanitized) < 3:
        sanitized = "{:0<3}".format(sanitized)

    # trim string to 24 characters
    sanitized = sanitized[:24]
}

_items = [
    azuremv1beta1.ResourceGroup {
        metadata = _metadata("{}-group".format(xr_metadata.name))
        spec = {
            forProvider = {
                location = params.location
            }
        }
    },
    azuremstoragev1beta1.Account {
        metadata = _metadata(sanitize_azure_storage_account_name("{}account".format(xr_metadata.name)))
        spec = {
            forProvider = {
                accountTier = "Standard"
                accountReplicationType = "LRS"
                location = params.location
                blobProperties = {
                    versioningEnabled = params.versioning
                }
                infrastructureEncryptionEnabled = True
                resourceGroupNameSelector = {
                    matchControllerRef = True
                }
            }
        }
    },
    azuremstoragev1beta1.Container {
        metadata: _metadata("{}-container".format(xr_metadata.name))
        spec = {
            forProvider = {
                if params.acl == "public":
                    containerAccessType = "blob"
                else:
                    containerAccessType = "private"
                storageAccountNameSelector = {
                    matchControllerRef = True
                }
            }
        }
    }
]
items = _items
