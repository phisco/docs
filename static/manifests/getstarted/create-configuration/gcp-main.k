import models.io.upbound.gcpm.storage.v1beta1 as gcpmstoragev1beta1

oxr = option("params").oxr      # observed composite resource
params = oxr.spec.parameters    # extract parameter values from XR

_metadata = lambda name: str -> any {
    {
        name = name
        annotations = {
            "krm.kcl.dev/composition-resource-name" = name
        }
    }
}

_items: [any] = [
    # Create GCP Bucket
    gcpmstoragev1beta1.Bucket {
        metadata: _metadata("{}-bucket".format(oxr.metadata.name))
        spec = {
            forProvider = {
                location = params.location
                versioning = {
                    enabled = params.versioning
                }
            }
        }
    },

    # Bucket ACL
    gcpmstoragev1beta1.BucketACL {
        metadata: _metadata("{}-acl".format(oxr.metadata.name))
        spec = {
            forProvider = {
                predefinedAcl = params.acl
                bucketSelector = {
                    matchControllerRef = True
                }
            }
        }
    }
]

items = _items
