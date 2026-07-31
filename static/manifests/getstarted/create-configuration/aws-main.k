import models.io.upbound.awsm.s3.v1beta1 as awsms3v1beta1

oxr = option("params").oxr      # observed composite resource
params = oxr.spec.parameters    # extract parameter values from XR

_metadata = lambda name: str -> any {
    {
        generateName = name         # due to global S3 naming restrictions we'll have
                                    # Crossplane generate a name to garauntee uniqueness
        annotations = {
            "krm.kcl.dev/composition-resource-name" = name
        }
    }
}

_items: [any] = [
    # Create S3 Bucket
    awsms3v1beta1.Bucket {
        metadata: _metadata("{}-bucket".format(oxr.metadata.name))
        spec = {
            forProvider = {
                region = params.region
            }
        }
    },

    # Bucket BOC
    awsms3v1beta1.BucketOwnershipControls {
        metadata: _metadata("{}-boc".format(oxr.metadata.name))
        spec = {
            forProvider = {
                bucketSelector: {
                    matchControllerRef: True
                }
                region = params.region
                rule = {
                    objectOwnership = "BucketOwnerPreferred"
                }
            }
        }
    },

    # Bucket PAB
    awsms3v1beta1.BucketPublicAccessBlock {
        metadata: _metadata("{}-pab".format(oxr.metadata.name))
        spec = {
            forProvider = {
                bucketSelector: {
                    matchControllerRef: True
                }
                region = params.region
                blockPublicAcls: False
                ignorePublicAcls: False
                restrictPublicBuckets: False
                blockPublicPolicy: False
            }
        }
    },

    # Bucket ACL
    awsms3v1beta1.BucketACL {
        metadata: _metadata("{}-acl".format(oxr.metadata.name))
        spec = {
            forProvider = {
                bucketSelector: {
                    matchControllerRef: True
                }
                region = params.region
                acl = params.acl
            }
        }
    },

    # Default encryption for the bucket
    awsms3v1beta1.BucketServerSideEncryptionConfiguration {
        metadata: _metadata("{}-encryption".format(oxr.metadata.name))
        spec = {
            forProvider = {
                region = params.region
                bucketSelector: {
                    matchControllerRef: True
                }
                rule = [
                    {
                        applyServerSideEncryptionByDefault = {
                            sseAlgorithm = "AES256"
                        }
                        bucketKeyEnabled = True
                    }
                ]
            }
        }
    }
]

# Set up versioning for the bucket if desired
if params.versioning:
    _items += [
        awsms3v1beta1.BucketVersioning{
            metadata: _metadata("{}-versioning".format(oxr.metadata.name))
            spec = {
                forProvider = {
                    region = params.region
                    bucketSelector: {
                        matchControllerRef: True
                    }
                    versioningConfiguration = {
                        status = "Enabled"
                    }
                }
            }
        }
    ]

items = _items
