---
title: 2. Build your composition logic
description: Create a composition function
---

import GlobalLanguageSelector, { CodeBlock } from '@site/src/components/GlobalLanguageSelector';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<GlobalLanguageSelector />

In the previous guide, you created a brand new project and reviewed the
foundational components of your project. This guide walks through how to update
those components to create real resources in your Upbound organization.

## Prerequisites

Make sure you've completed the previous guide and have:

* [An Upbound account][up-account]
* [The Up CLI installed][up-cli]
* [kubectl installed][kubectl-installed]
* [Docker Desktop][docker-desktop] running
* A project with the basic structure (`upbound.yaml`, `apis/`,`examples/`)
* Provider dependencies added
* An XRD and Composition generated from your example claim

If you missed any of the previous steps, go to the [project foundations][project-foundations] guide to
get started.

## Generate a function

Composition functions allow you to write the logic for creating cloud resources
with programming languages like KCL, Python, or Go. 

With composition functions you can:

* Write code with familiar programming concepts like variables, loops, and
    conditions
* Catch errors with type safety before deployment
* Keep related logic together in an easier to parse format
* Test your infrastructure logic like any other code

Your composition function is a program you write that translates
your user's requests as the inputs and returns specific cloud resources as the
outputs.

Generate the composition function scaffolding and choose your preferred
language:

<CodeBlock language="kcl">

```shell
up function generate example-function apis/storagebuckets/composition.yaml --language=kcl
```

</CodeBlock>

<CodeBlock language="python">

```shell
up function generate example-function apis/storagebuckets/composition.yaml --language=python
```

</CodeBlock>

<CodeBlock language="go">

```shell
up function generate example-function apis/storagebuckets/composition.yaml --language=go
```

</CodeBlock>

<CodeBlock language="go-templating">

```shell
up function generate example-function apis/storagebuckets/composition.yaml --language=go-templating
```

</CodeBlock>

This command creates a function directory and creates a new file based on your
chosen language.

## Create your function logic

Next, create the actual program logic that builds your cloud resources.


<CodeBlock cloud="aws" language="kcl">

Paste the following into `main.k`:

```yaml title="upbound-hello-world/functions/example-function/main.k" manifest="/manifests/getstarted/create-configuration/aws-main.k"
```

</CodeBlock>

<CodeBlock cloud="aws" language="python">

Paste the following into `main.py`:

```python title="upbound-hello-world/functions/example-function/main.py" manifest="/manifests/getstarted/create-configuration/aws-main.py"
```

</CodeBlock>


<CodeBlock cloud="azure" language="kcl">

Paste the following into `main.k`:

```yaml title="upbound-hello-world/functions/example-function/main.k" manifest="/manifests/getstarted/create-configuration/azure-main.k"
```

</CodeBlock>

<CodeBlock cloud="azure" language="python">

Paste the following into `main.py`:

```python title="upbound-hello-world/functions/example-function/main.py" manifest="/manifests/getstarted/create-configuration/azure-main.py"
```

</CodeBlock>


<CodeBlock cloud="gcp" language="kcl">

Paste the following into `main.k`:

```yaml title="upbound-hello-world/functions/example-function/main.k" manifest="/manifests/getstarted/create-configuration/gcp-main.k"
```

</CodeBlock>

<CodeBlock cloud="gcp" language="python">

Paste the following into `main.py`:

```python title="upbound-hello-world/functions/example-function/main.py" manifest="/manifests/getstarted/create-configuration/gcp-main.py"
```

</CodeBlock>

<CodeBlock cloud="aws" language="go">

This example targets AWS. Paste the following into `fn.go`:

```go title="upbound-hello-world/functions/example-function/fn.go" manifest="/manifests/getstarted/create-configuration/aws-fn.go"
```

For the full Go composition function guide, including working with generated
models, see [Create a composition with Go][go-compositions].

</CodeBlock>

<CodeBlock cloud="aws" language="go-templating">

This example targets AWS and covers the bucket, ACL, and versioning resources.
Paste each file below into your function's directory, matching the filenames:

<Tabs>
<TabItem value="00-prelude" label="00-prelude.yaml.gotmpl">

```yaml manifest="/manifests/getstarted/create-configuration/aws-00-prelude.yaml.gotmpl"
```

</TabItem>
<TabItem value="01-bucket" label="01-bucket.yaml.gotmpl">

```yaml manifest="/manifests/getstarted/create-configuration/aws-01-bucket.yaml.gotmpl"
```

</TabItem>
<TabItem value="02-acl" label="02-acl.yaml.gotmpl">

```yaml manifest="/manifests/getstarted/create-configuration/aws-02-acl.yaml.gotmpl"
```

</TabItem>
<TabItem value="03-versioning" label="03-versioning.yaml.gotmpl">

```yaml manifest="/manifests/getstarted/create-configuration/aws-03-versioning.yaml.gotmpl"
```

</TabItem>
</Tabs>

For the full Go templating guide, including the bucket ownership, public
access block, and encryption resources this example skips, see [Create a
composition with Go Templates][go-template-compositions].

</CodeBlock>

Save your composition file.

## Review your function

### Resource imports and user inputs

<CodeBlock cloud="aws" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"
import models.io.upbound.awsm.s3.v1beta1 as awsms3v1beta1

oxr = option("params").oxr      # observed composite resource
params = oxr.spec.parameters    # extract parameter values from XR

```

This section:
<!-- vale Microsoft.Terms = NO -->
* Imports the cloud resource definitions required to create the resource
* Extracts the user-specified values in the claim (`params = oxr.spec.parameters`)
<!-- vale Microsoft.Terms = YES -->

</CodeBlock>

<CodeBlock cloud="aws" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"
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

```

This section:
<!-- vale Microsoft.Terms = NO -->
* Imports the specific api version (e.g. `v1beta1`) of the python models for each cloud resource
* Imports the python model for our API we are building `.model.com.example.platform.storagebucket`
<!-- vale Microsoft.Terms = YES -->

</CodeBlock>


<CodeBlock cloud="azure" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"

import regex
import models.io.upbound.azurem.v1beta1 as azuremv1beta1
import models.io.upbound.azurem.storage.v1beta1 as azuremstoragev1beta1

oxr = option("params").oxr      # observed composite resource
params = oxr.spec.parameters    # extract parameter values from XR
xr_metadata = oxr.metadata      # store XR metadata

```

This section:
<!-- vale Microsoft.Terms = NO -->
* Imports the cloud resource definitions required to create the resource
* Extracts the user-specified values in the claim (`params = oxr.spec.parameters`)
* Stores the XR metadata to use later on in the composition function
<!-- vale Microsoft.Terms = YES -->

</CodeBlock>

<CodeBlock cloud="azure" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"
import re

from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

from .model.io.k8s.apimachinery.pkg.apis.meta import v1 as metav1
from .model.io.upbound.m.azure.resourcegroup import v1beta1 as rgv1beta1
from .model.io.upbound.m.azure.storage.account import v1beta1 as acctv1beta1
from .model.io.upbound.m.azure.storage.container import v1beta1 as contv1beta1
from .model.com.example.platform.storagebucket import v1alpha1
```

This section:
<!-- vale Microsoft.Terms = NO -->
* Imports the specific api version (e.g. `v1beta1`) of the python models for each cloud resource
* Imports the python model for our API we are building `.model.com.example.platform.storagebucket`
* Imports python regex library for use in a helper function
<!-- vale Microsoft.Terms = YES -->

</CodeBlock>


<CodeBlock cloud="gcp" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"
import models.io.upbound.gcpm.storage.v1beta1 as gcpmstoragev1beta1

oxr = option("params").oxr      # observed composite resource
params = oxr.spec.parameters    # extract parameter values from XR 
```

This section:
<!-- vale Microsoft.Terms = NO -->
* Imports the cloud resource definitions required to create the resource
* Extracts the user-specified values in the claim (`params = oxr.spec.parameters`)
<!-- vale Microsoft.Terms = YES -->


</CodeBlock>

<CodeBlock cloud="gcp" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"
from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

from .model.io.upbound.m.gcp.storage.bucket import v1beta1 as mbucketv1beta1
from .model.io.upbound.m.gcp.storage.bucketacl import v1beta1 as maclv1beta1
from .model.com.example.platform.storagebucket import v1alpha1
```

This section:
<!-- vale Microsoft.Terms = NO -->
* Imports the specific api version (e.g. `v1beta1`) of the python models for each cloud resource
* Imports the python model for our API we are building `.model.com.example.platform.storagebucket`
<!-- vale Microsoft.Terms = YES -->

</CodeBlock>


### Metadata and helper functions

<CodeBlock cloud="aws" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"

_metadata = lambda name: str -> any {
    {
        generateName = name         # due to global S3 naming restrictions we'll have 
                                    # Crossplane generate a name to garauntee uniqueness
        annotations = {
            "krm.kcl.dev/composition-resource-name" = name
        }
    }
}

```

</CodeBlock>

<CodeBlock cloud="aws" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"

def resource_name(xr, resource):
    return "{}-{}".format(xr.metadata.name, resource)

def default_metadata(name):
    return {
        "generateName": name
    }

```

</CodeBlock>


<CodeBlock cloud="azure" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"
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
```

</CodeBlock>

<CodeBlock cloud="azure" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"

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

```

</CodeBlock>


<CodeBlock cloud="gcp" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"
_metadata = lambda name: str -> any {
    {
        name = name
        annotations = {
            "krm.kcl.dev/composition-resource-name" = name
        }
    }
}
```

</CodeBlock>

<CodeBlock cloud="gcp" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"
def resource_name(xr, resource):
    return "{}-{}".format(xr.metadata.name, resource)

def default_metadata(name):
    return {
        "name": name
    }
```

</CodeBlock>


This section:

* Standardizes resource naming
* Adds required labels and annotations where needed
* Leverages helper functions to sanitize naming where applicable
* Reduces metadata duplication

### Cloud resource definition

<CodeBlock cloud="aws" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"
# Create S3 Bucket
    awsms3v1beta1.Bucket {
        metadata: _metadata("{}-bucket".format(oxr.metadata.name))
        spec = {
            forProvider = {
                region = params.region
            }
        }
    },
```

</CodeBlock>

<CodeBlock cloud="aws" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"
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
```

</CodeBlock>


<CodeBlock cloud="azure" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"
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
```

</CodeBlock>

<CodeBlock cloud="azure" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"
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
```

</CodeBlock>


<CodeBlock cloud="gcp" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"
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
```

</CodeBlock>

<CodeBlock cloud="gcp" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"
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
```

</CodeBlock>


This section:

* Creates the primary resource for your chosen cloud provider
* Inserts your claim parameters as required fields
* Applies the metadata function to the resource


### Security configuration

<CodeBlock cloud="aws" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"
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
```
</CodeBlock>

<CodeBlock cloud="aws" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"
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
```

</CodeBlock>


<CodeBlock cloud="azure" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"
# Azure handles security through the storage account configuration
# infrastructureEncryptionEnabled is set to True in the Account spec

azuremstoragev1beta1.Account {
    ...
    spec = {
        forProvider = {
            ...
            infrastructureEncryptionEnabled = True
            ...
        }
    }
},
```

</CodeBlock>

<CodeBlock cloud="azure" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"
# Security is configured in the storage account spec

desired_acct = acctv1beta1.Account(
    ...
    spec = acctv1beta1.Spec(
        forProvider = acctv1beta1.ForProvider(
            ...
            infrastructureEncryptionEnabled = True,
            ...
        ),
    ),
)
resource.update(rsp.desired.resources["account"], desired_acct)

```

</CodeBlock>


<CodeBlock cloud="gcp" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"
# GCP buckets have default encryption enabled automatically
```

</CodeBlock>

<CodeBlock cloud="gcp" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"
# GCP buckets have default encryption enabled automatically
```

</CodeBlock>



This section:

* Applies object ownership to the bucket
* Allows for public access to the bucket

### Access control and encryption

<CodeBlock cloud="aws" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"
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
```
</CodeBlock>

<CodeBlock cloud="aws" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"
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
```

</CodeBlock>


<CodeBlock cloud="azure" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"
# Container access control
azuremstoragev1beta1.Container {
    ...
    spec = {
        forProvider = {
            if params.acl == "public":
                containerAccessType = "blob"
            else:
                containerAccessType = "private"
            ...
        }
    }
}
```

</CodeBlock>

<CodeBlock cloud="azure" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"
desired_cont = contv1beta1.Container(
    ...
    spec = contv1beta1.Spec(
        forProvider = contv1beta1.ForProvider(
            containerAccessType = "blob" if params.acl == "public" else "private",
            ...
        ),
    ),
)
resource.update(rsp.desired.resources["container"], desired_cont)
```

</CodeBlock>


<CodeBlock cloud="gcp" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"
# Bucket ACL
gcpmstoragev1beta1.BucketACL {
    ...
    spec = {
        forProvider = {
            predefinedAcl = params.acl
            ...
        }
    }
}
```

</CodeBlock>

<CodeBlock cloud="gcp" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"
# Bucket ACL
desired_acl = maclv1beta1.BucketACL(
    ...
    spec = maclv1beta1.Spec(
        forProvider = maclv1beta1.ForProvider(
            predefinedAcl=params.acl,
            ...
        ),
    ),
)
resource.update(rsp.desired.resources["acl"], desired_acl)
```

</CodeBlock>



This section:

* Sets the access level using the user's ACL parameter
* Automatically enables encryption for all objects

### Bucket versioning

<CodeBlock cloud="aws" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"
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

```

</CodeBlock>

<CodeBlock cloud="aws" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"
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
```

</CodeBlock>


<CodeBlock cloud="azure" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"
# Versioning is configured in the storage account blob properties
azuremstoragev1beta1.Account {
    ...
    spec = {
        forProvider = {
            ...
            blobProperties = {
                versioningEnabled = params.versioning
            }
            ...
        }
    }
},
```

</CodeBlock>

<CodeBlock cloud="azure" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"
# Versioning is configured in the storage account blob properties
desired_acct = acctv1beta1.Account(
    ...
    spec = acctv1beta1.Spec(
        forProvider = acctv1beta1.ForProvider(
            ...
            blobProperties = {
                "versioningEnabled": params.versioning
            },
            ...
        ),
    ),
)
resource.update(rsp.desired.resources["account"], desired_acct)
```

</CodeBlock>


<CodeBlock cloud="gcp" language="kcl">

```yaml-noCopy title="upbound-hello-world/functions/example-function/main.k"
# Versioning is configured directly in the bucket spec
gcpmstoragev1beta1.Bucket {
    ...
    spec = {
        forProvider = {
            ...
            versioning = {
                enabled = params.versioning
            }
        }
    }
},
```

</CodeBlock>

<CodeBlock cloud="gcp" language="python">

```python-noCopy title="upbound-hello-world/functions/example-function/main.py"
# Versioning is configured directly in the bucket spec
desired_bucket = mbucketv1beta1.Bucket(
    ...
    spec = mbucketv1beta1.Spec(
        forProvider = mbucketv1beta1.ForProvider(
            ...
            versioning = {
                "enabled": params.versioning
            }
        ),
    ),
)
resource.update(rsp.desired.resources["bucket"], desired_bucket)
```

</CodeBlock>



This section:

* Only creates versioning if requested in the claim
* Captures the items defined in the function as a single variable.

Save your changes.

## Render your composition locally

The `up composition render` command allows you to review your desired composed
resources. 

Render the composition against your XR file:

```shell
up composition render apis/storagebuckets/composition.yaml examples/storagebucket/example.yaml
```

This process ensures the build, configuration, and orchestration runs as
expected before you deploy to a development control plane.
<!-- vale write-good.TooWordy = NO -->
Errors in the render command can indicate a malformed function or other issues
within the composition itself.

<!-- vale write-good.TooWordy = YES -->
## Next steps

You constructed a new embedded function that allows user input from your claim
file. This function uses your composition to create a fully configured storage
resources to your specifications.

The next guide walks through how to test your composition function logic with
the built-in test suite.

[up-account]: https://www.upbound.io/register/?utm_source=docs&utm_medium=cta&utm_campaign=docs_get_started
[project-foundations]: /getstarted/builders-workshop/project-foundations
[up-cli]: /manuals/cli/overview
[kubectl-installed]: https://kubernetes.io/docs/tasks/tools/
[docker-desktop]: https://www.docker.com/products/docker-desktop/
[go-compositions]: /manuals/cli/howtos/compositions/go
[go-template-compositions]: /manuals/cli/howtos/compositions/go-template
