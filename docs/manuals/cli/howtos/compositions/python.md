---
title: Create a composition with Python
sidebar_position: 4
description: Use Python to create resources with your control plane.
aliases:
    - /core-concepts/authoring-compositions
---


Upbound Crossplane allows you to choose how you want to write your composition
logic based on your preferred language.

You can choose:

[Go][go] - High performance. IDE support with full type safety.

[Go Templates][go-templates] - Good for YAML-like configurations. IDE support with YAML
language server.

[KCL][kcl] - Concise. Good for transitioning from another configuration language
like `HCL`. IDE support with language server.

 **Python (this guide)** - Highly accessible, supports complex logic. Provides type hints and
autocompletion in your IDE.

<!-- vale gitlab.HeadingContent = NO -->
## Overview
<!-- vale gitlab.HeadingContent = YES -->

This guide explains how to create compositions that turn your XRs into actual
cloud resources. Compositions allow you to implement the business logic that
powers your control plane.

:::important
This guide assumes you're familiar with Python. If you'd like to become more
familiar with Python, the official [Python tutorial][python-tutorial] is a good place
to start.
:::

Use this guide after you define your API schema and need to write the logic that
creates and manages the underlying resources.

## Prerequisites

Before you begin, make sure:

* You designed your XRD
* You've added provider dependencies
* You have Python 3.11+ installed
* You have the Python VS Code extension installed
* You understand your XRD schema and what resources you need to create


## Create your composition scaffold

Use the XRD you created in the previous step to generate a new composition:

```shell
up composition generate apis/<your_resource_name>/definition.yaml
```

This command creates `apis/<your_resource_name>/composition.yaml` which
references the XRD.

## Generate your function

Use your chosen programming language to generate a new function:

```shell
up function generate --language=python compose-resources
apis/<your_resource_name>/composition.yaml
```

This command creates a `functions/compose-resources` directory with your function
code and updates your composition file to reference it.

Your function file in `functions/compose-resources/main.py` should be similar
to:

```py
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

def compose(req: fnv1.RunFunctionRequest, rsp: fnv1.RunFunctionResponse):
    # Your business logic goes here
```

## Models

Your function begins with:

```python
from crossplane.function.proto.v1 import run_function_pb2 as fnv1
```
<!-- vale write-good.Passive = NO -->
These provider _models_ are packaged resource names that
allow your function to reference the provider resources. The period prefix on
`.model` is required for Python to look for the model package in the same
directory as main.py.
<!-- vale write-good.Passive = YES -->

Upbound Official Providers and some other packages include Pydantic models for
their resources. These models enable in-line documentation, linting,
autocompletion, and other features when working with Crossplane resources in
embedded Python functions. 

To add new models, add the package dependency with the `up` CLI:

```shell
up dependency add xpkg.upbound.io/upbound/provider-aws-s3
```

Rebuild your project provider cache:


```shell
up project build  # Generate models in .up/python directory
```

Add the model to your function:

```python
from crossplane.function.proto.v1 import run_function_pb2 as fnv1
from .model.com.example.platform.storagebucket import v1alpha1
from .model.io.upbound.aws.s3.bucket import v1beta1 as bucketv1beta1
```

:::tip
The generated model module and class name match your XRD's `kind` exactly. The
examples on this page assume a `v2` XRD (`apiextensions.crossplane.io/v2`) with
`kind: StorageBucket`. If your XRD uses the legacy `v1` API
(`apiextensions.crossplane.io/v1`), your XRD's `kind` uses an `X` prefix, for
example `kind: XStorageBucket`, so import from `.model...xstoragebucket` and
use `v1alpha1.XStorageBucket` instead.
:::

The imports in this example are specifically for AWS S3 buckets. They follow a
similar structure for all resources:

* `fnv1` - Provides protocol buffer types for function communication
* `v1alpha` - References your XRD's generated Pydantic model
* `bucketv1beta1` - The AWS S3 provider's Pydantic model

### Optional and required fields


Upbound's Python models know which resource fields Crossplane requires and which
are optional.

Required fields have a specific type, like str - a string.

Python raises an exception if you create a model without supplying a required
field. This can be a problem when updating the desired composite resource (XR).

You should only include the fields your function has an opinion about when you
update the desired XR. This can be a problem if for example Crossplane requires
an XR spec field, but your function only wants to update a status field.

When updating the desired XR, you can avoid issues due to required fields by
using the resource's status model directly.

```python
from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

from .model.com.example.platform.storagebucket import v1alpha1


def compose(req: fnv1.RunFunctionRequest, rsp: fnv1.RunFunctionResponse):
    # Create a model of the XR's status.
    desired_xr_status = v1alpha1.Status()

    # Include any desired status from previous functions in the pipeline.
    if "status" in req.desired.composite.resource:
        desired_xr_status = v1alpha1.Status(**req.desired.composite.resource["status"])

    # Update only the status field your function is concerned with.
    desired_xr_status.replicas = 3

    # Dump the model as a Python dictionary.
    resource.update(rsp.desired.composite, {"status": desired_xr_status.model_dump()})
```

Optional fields have a union type with None, like str | None. This means the
field can be a string, or None - Python's null value.

Pydantic warns you when you copy a required field to an optional field.

For example, Pydantic warns you if you try to copy an optional `spec.region` field
from an XR to a required `spec.forProvider.region` field of an MR:


```python
from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

from .model.io.upbound.aws.s3.bucket import v1beta1 as bucketv1beta1
from .model.org.example.storagebucket import v1alpha1


def compose(req: fnv1.RunFunctionRequest, rsp: fnv1.RunFunctionResponse):
    observed_xr = v1alpha1.StorageBucket(**req.observed.composite.resource)

    desired_bucket = bucketv1beta1.Bucket(
        spec=bucketv1beta1.Spec(
            forProvider=bucketv1beta1.ForProvider(
                region=observed_xr.spec.region,  # Warning: Argument of type "str | None" cannot be assigned to parameter "region" of type "str"
            ),
        ),
    )
    resource.update(rsp.desired.resources["bucket"], desired_bucket)
```

You can address this warning two ways.

If the optional field could be None in practice, handle that case by specifying
a default value.

```python
from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

from .model.io.upbound.aws.s3.bucket import v1beta1 as bucketv1beta1
from .model.org.example.storagebucket import v1alpha1


def compose(req: fnv1.RunFunctionRequest, rsp: fnv1.RunFunctionResponse):
    observed_xr = v1alpha1.StorageBucket(**req.observed.composite.resource)

    region = "us-west-2"
    if observed_xr.spec.region is not None:
        region = observed_xr.spec.

    desired_bucket = bucketv1beta1.Bucket(
        spec=bucketv1beta1.Spec(
            forProvider=bucketv1beta1.ForProvider(
                region=observed_xr.spec.region or "us-west-2",  # Default to "us-west-2" if region is None.
            ),
        ),
    )
    resource.update(rsp.desired.resources["bucket"], desired_bucket)
```

If the optional field can't be None in practice, use a type: ignore comment to silence the warning.

```python
from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

from .model.io.k8s.apimachinery.pkg.apis.meta import v1 as metav1
from .model.io.upbound.aws.s3.bucket import v1beta1 as bucketv1beta1
from .model.org.example.storagebucket import v1alpha1


def compose(req: fnv1.RunFunctionRequest, rsp: fnv1.RunFunctionResponse):
    observed_xr = v1alpha1.StorageBucket(**req.observed.composite.resource)

    desired_bucket = bucketv1beta1.Bucket(
        from .model.io.k8s.apimachinery.pkg.apis.meta import v1 as metav1
        metadata=metav1.ObjectMeta(
            name=observed_xr.metadata.name + "-bucket", # type: ignore  # The observed XR will always have a name.
        ),
        spec=bucketv1beta1.Spec(
            forProvider=bucketv1beta1.ForProvider(
                region="us-west-2",
            ),
        ),
    )
    resource.update(rsp.desired.resources["bucket"], desired_bucket)
```

## Create your function logic

Next, add the function logic. The example below creates an S3 bucket:


```python
from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

from .model.com.example.platform.storagebucket import v1alpha1
from .model.io.upbound.aws.s3.bucket import v1beta1 as bucketv1beta1


def compose(req: fnv1.RunFunctionRequest, rsp: fnv1.RunFunctionResponse):
    # Load the observed XR into a Pydantic model.
    observed_xr = v1alpha1.StorageBucket(**req.observed.composite.resource)

    # Create the cloud resource specification
    desired_bucket = bucketv1beta1.Bucket(
        spec=bucketv1beta1.Spec(
            forProvider=bucketv1beta1.ForProvider(
                region=observed_xr.spec.region or "us-west-2",
            ),
        ),
    )
    resource.update(rsp.desired.resources["bucket"], desired_bucket)
```

## Inputs

Function logic determines how Crossplane handles your resource creation.
In the `RunFunctionRequest`, there are four _inputs_ that Crossplane can parse:


1. **Observed state**: What real resources currently exist?

    ```python
    # The API request
    observed_xr = v1alpha1.StorageBucket(**req.observed.composite.resource)
    ```

2. **Desired state**: What resources should exist?

    ```python
    # Create the cloud resource specification
    desired_bucket = bucketv1beta1.Bucket(
        spec=bucketv1beta1.Spec(
            forProvider=bucketv1beta1.ForProvider(
                region=observed_xr.spec.region or "us-west-2",
            ),
        ),
    )    
    ```

3. **Function logic** - What does Crossplane do?

    ```python
    # Reconcile the desired and observed states
    resource.update(rsp.desired.resources["bucket"], bucket)    
    ```

<!-- vale write-good.TooWordy = NO -->
4. **Pipeline context** - Information to pass to subsequent functions in the
   pipeline.
<!-- vale write-good.TooWordy = YES -->

For a more complex version of a Python function, expand the example below:


<details>

<summary>A more advanced Python function</summary>

The function `main.py` file below takes a composite resource (XR) as input and
produces managed resources (MRs) from the
[S3 provider][s3-provider-1]
based on its parameters.

The function always composes an S3 bucket. When the S3 bucket exists, it also
composes a bucket access control list (ACL). The ACL references the bucket by
name.

If the composite resource's `spec.versioning` field is `True`, the function
enables versioning by composing a bucket versioning configuration. Like the ACL,
the versioning configuration references the bucket by name.

```python
from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

from .model.io.k8s.apimachinery.pkg.apis.meta import v1 as metav1
from .model.com.example.platform.storagebucket import v1alpha1
from .model.io.upbound.aws.s3.bucket import v1beta1 as bucketv1beta1
from .model.io.upbound.aws.s3.bucketacl import v1beta1 as aclv1beta1
from .model.io.upbound.aws.s3.bucketownershipcontrols import v1beta1 as bocv1beta1
from .model.io.upbound.aws.s3.bucketpublicaccessblock import v1beta1 as pabv1beta1
from .model.io.upbound.aws.s3.bucketversioning import v1beta1 as verv1beta1
from .model.io.upbound.aws.s3.bucketserversideencryptionconfiguration import (
    v1beta1 as ssev1beta1,
)


def compose(req: fnv1.RunFunctionRequest, rsp: fnv1.RunFunctionResponse):
    observed_xr = v1alpha1.StorageBucket(**req.observed.composite.resource)
    params = observed_xr.spec.parameters

    desired_bucket = bucketv1beta1.Bucket(
        spec=bucketv1beta1.Spec(
            forProvider=bucketv1beta1.ForProvider(
                region=params.region,
            ),
        ),
    )
    resource.update(rsp.desired.resources["bucket"], desired_bucket)

    # The desired ACL, encryption, and versioning resources all need to refer to
    # the bucket by its external name, which is stored in its external name
    # annotation. Return early if the Bucket's external-name annotation isn't
    # set yet.
    if "bucket" not in req.observed.resources:
        return

    observed_bucket = bucketv1beta1.Bucket(**req.observed.resources["bucket"].resource)
    if observed_bucket.metadata is None or observed_bucket.metadata.annotations is None:
        return
    if "crossplane.io/external-name" not in observed_bucket.metadata.annotations:
        return

    bucket_external_name = observed_bucket.metadata.annotations[
        "crossplane.io/external-name"
    ]

    desired_acl = aclv1beta1.BucketACL(
        spec=aclv1beta1.Spec(
            forProvider=aclv1beta1.ForProvider(
                region=params.region,
                bucket=bucket_external_name,
                acl=params.acl,
            ),
        ),
    )
    resource.update(rsp.desired.resources["acl"], desired_acl)

    desired_boc = bocv1beta1.BucketOwnershipControls(
        spec=bocv1beta1.Spec(
            forProvider=bocv1beta1.ForProvider(
                region=params.region,
                bucket=bucket_external_name,
                rule=[
                    bocv1beta1.RuleItem(
                        objectOwnership="BucketOwnerPreferred",
                    ),
                ],
            )
        ),
    )
    resource.update(rsp.desired.resources["boc"], desired_boc)

    desired_pab = pabv1beta1.BucketPublicAccessBlock(
        spec=pabv1beta1.Spec(
            forProvider=pabv1beta1.ForProvider(
                region=params.region,
                bucket=bucket_external_name,
                blockPublicAcls=False,
                ignorePublicAcls=False,
                restrictPublicBuckets=False,
                blockPublicPolicy=False,
            )
        ),
    )
    resource.update(rsp.desired.resources["pab"], desired_pab)

    desired_sse = ssev1beta1.BucketServerSideEncryptionConfiguration(
        spec=ssev1beta1.Spec(
            forProvider=ssev1beta1.ForProvider(
                region=params.region,
                bucket=bucket_external_name,
                rule=[
                    ssev1beta1.RuleItem(
                        applyServerSideEncryptionByDefault=[
                            ssev1beta1.ApplyServerSideEncryptionByDefaultItem(
                                sseAlgorithm="AES256",
                            ),
                        ],
                        bucketKeyEnabled=True,
                    ),
                ],
            ),
        ),
    )
    resource.update(rsp.desired.resources["sse"], desired_sse)

    # Return early without composing a BucketVersioning MR if the XR doesn't
    # have versioning enabled.
    if not params.versioning:
        return

    desired_versioning = verv1beta1.BucketVersioning(
        spec=verv1beta1.Spec(
            forProvider=verv1beta1.ForProvider(
                region=params.region,
                bucket=bucket_external_name,
                versioningConfiguration=[
                    verv1beta1.VersioningConfigurationItem(
                        status="Enabled",
                    ),
                ],
            ),
        ),
    )
    resource.update(rsp.desired.resources["versioning"], desired_versioning)
```

</details>


## Outputs

`RunFunctionResponse` returns three outputs which update the state of the
control plane:

1.**Desired state** of your composed resources
2 **Status conditions** to apply to the composite resource or claim
3. **Context** to pass to other functions in the pipeline

Outputs are part of `RunFunctionResponse` and are pre-populated with the
request's desired state and context. Python functions only need to update the
fields in the objects that need to change.

:::tip
You can select the RunFunctionResponse object in Visual Studio Code to see what
fields it has.

The Python function SDK generates the `RunFunctionResponse` object from a protobuf
definition. Read the Python Generated Code Guide to learn about protobuf
generated code.
:::

You can add or update composed resources using the resource.update helper
function in the Crossplane Python SDK:

```python
from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1


def compose(req: fnv1.RunFunctionRequest, rsp: fnv1.RunFunctionResponse):
    composed = ... # Construct a composed resource
    resource.update(rsp.desired.resources["my-resource"], composed)
```

Similarly, you can update the status of the composite resource by updating it in
the response:

```python
from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

from .model.com.example.platform.mytype import v1alpha1


def compose(req: fnv1.RunFunctionRequest, rsp: fnv1.RunFunctionResponse):
    status_update = {
        "status": {
            "someInformation": "cool-status"
        }
    }
    resource.update(rsp.desired.composite, status_update)
```

:::tip
If you don't want to use a model, you can also pass resource.update a Python
dictionary.

```python
from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1


def compose(req: fnv1.RunFunctionRequest, rsp: fnv1.RunFunctionResponse):
    resource.update(rsp.desired.composite, {
        "status": {
            "replicas": 3,
        },
    })
```
:::


[s3-provider-1]: https://marketplace.upbound.io/providers/upbound/provider-aws-s3/v2.0.0
[go]: /manuals/cli/howtos/compositions/go
[go-templates]: /manuals/cli/howtos/compositions/go-template
[kcl]: /manuals/cli/howtos/compositions/kcl
<!-- [python]: /manuals/cli/projects/compositions/python -->
[python-tutorial]: https://docs.python.org/3/tutorial/
