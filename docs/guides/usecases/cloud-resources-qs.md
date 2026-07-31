---
title: Create custom cloud resources
sidebar_position: 3
---
import GlobalLanguageSelector, { CodeBlock } from '@site/src/components/GlobalLanguageSelector';

You can use control planes to define custom resource types for external
resources, like your cloud provider. This guide walks through how to create and
deploy custom resource types for your cloud provider on a control plane.

## Prerequisites

This quickstart takes around 10 minutes to complete. 
Before beginning, make sure that:

- you have installed the [Upbound CLI][up].
- you have a Docker-compatible container runtime installed on your system and running.
- you have an AWS, Azure, or GCP account to use for testing.

This guide uses Python to build custom cloud resources in AWS, Azure, or GCP.

## Create a control plane project

Crossplane works by letting you define new resource types in Kubernetes that
invoke function pipelines to template and generate lower-level resources. Just
like any other software project, a _control plane project_ is a source-level
representation of your control plane. A control plane project gets built into an
OCI package and installed into a running instance of Upbound Crossplane.

Create a control plane project on your machine using one of Upbound's templates
by running the following command:

<Tabs groupId="cloud-provider">
<TabItem value="aws" label="AWS">
```shell
up project init --template="project-template-aws-s3" --language="python" my-new-project
```
</TabItem>
<TabItem value="azure" label="Azure">
```shell
up project init --template="project-template-azure-storage" --language="python" my-new-project
```
</TabItem>
<TabItem value="gcp" label="GCP">
```shell
up project init --template="project-template-gcp-storage" --language="python" my-new-project
```
</TabItem>
</Tabs>

## Understand the project

<!-- vale write-good.Passive = NO -->
The project defines a resource type called `StorageBucket`, which implements an
opinionated storage bucket abstraction. The type is defined as a Crossplane
Composite Resource Definition (XRD) in the file
`apis/storagebuckets/definition.yaml`.

<!-- vale gitlab.FutureTense = NO -->
<!-- vale Google.Will = NO -->
<!-- vale gitlab.SentenceLength = NO -->
A Crossplane Composition defines the function pipeline that will run whenever a
`StorageBucket` is created or updated. The Composition for the `StorageBucket`
type is in `apis/storagebuckets/composition.yaml` and contains two functions: a
project-specific one that creates resources, and a generic one that detects when
the created resources become ready. The function that creates resources is
implemented in the file `functions/compose-bucket/main.py`.
<!-- vale write-good.Passive = YES -->
<!-- vale gitlab.FutureTense = YES -->
<!-- vale Google.Will = YES -->
<!-- vale gitlab.SentenceLength = YES -->

## Deploy your control plane

In the root directory of your project, use `up project run` to run your project
locally:

```shell
up project run --local
```

This command deploys a container with an Upbound Crossplane instance on your
machine, builds the project, and installs the resulting Crossplane packages into
the container. It also updates your current kubeconfig context to refer to the
Crossplane instance.

Upbound Crossplane provides a built in Web UI for you to browse your control
plane resources. To open your browser to the WebUI, use the `up` CLI:

```shell
up uxp web-ui open
```

## Connect your cloud account

Your project configuration requires an authentication method.

A `ProviderConfig` is a custom resource that defines how your control plane
authenticates and connects with cloud providers like AWS. It acts as a
configuration bridge between your control plane's managed resources and the
cloud provider's API.

### Create a secret

<Tabs groupId="cloud-provider">
<TabItem value="aws" label="AWS">

First, create a secret with your AWS credentials. To create the secret download
your AWS access key ID and secret access key. 

In the root of your project, create a new file called `aws-credentials.txt` and
paste your AWS access key ID and secret access key.

<EditCode language="shell">
{`
[default]
aws_access_key_id = $@YOUR_ACCESS_KEY_ID$@
aws_secret_access_key = $@YOUR_SECRET_ACCESS_KEY$@
`}
</EditCode>

Next, create a new secret to store your credentials in your control plane. The
`kubectl create secret` command puts your AWS login details in the control plane
secure storage:

```shell
kubectl create secret generic aws-secret \
    -n crossplane-system \
    --from-file=my-aws-secret=./aws-credentials.txt
```

</TabItem>

<TabItem value="azure" label="Azure">

A service principal is an application within the Azure Active Directory that
passes client_id, client_secret, and tenant_id authentication tokens to create
and manage Azure resources. You can also authenticate with a
client_certificate instead of a client_secret.


First, find the Subscription ID for your Azure account.

```shell
az account list
```

Note the value of the id in the return output.

In the root of your project, create a service principle `Owner` role. Update the `<subscription_id>` with the `id` from the previous command.

<EditCode language="shell">
{`
az ad sp create-for-rbac --sdk-auth --role Owner --scopes /subscriptions/$@<SUBSCRIPTION_ID>$@ \ > azure.json
`}
</EditCode>


This command writes your client ID, secret, and subscription tenant ID in the
`azure.json` file.

Next, use `kubectl` to associate your `azure.json` file with a generic Kubernetes secret.

```shell
kubectl create secret generic azure-secret -n crossplane-system --from-file=creds=./azure.json
```

</TabItem>

<TabItem value="gcp" label="GCP">

To authenticate with GCP, you need to store your GCP account key as a Kubernetes
secret.

First, create or download your GCP service account key JSON file in the root of
your project.

You must encode your authentication key as a base-64 string. 

```shell
base64 --input gcp-credentials.json
```

Create a new file called `my-gcp-secret.yaml`. Copy and paste the configuration
below to create your Secret object:

<EditCode language="yaml">
{`
apiVersion: v1
kind: Secret
metadata:
    name: gcp-secret
    namespace: crossplane-system
    type: Opaque
data:
    my-gcp-secret: $@<YOUR_BASE_64_ENCODED_KEY>$@
`}
</EditCode>


Next, create the Kubernetes secret with `kubectl create secret`:

```shell
kubectl create secret generic \
gcp-secret \
-n crossplane-system \
--from-file=my-gcp-secret=./gcp-credentials.json
```


</TabItem>
</Tabs>

### Create a `ProviderConfig`


Next, create a new file called `provider-config.yaml` and paste the
configuration below:


<Tabs groupId="cloud-provider">
<TabItem value="aws" label="AWS">

```yaml title="upbound-hello-world/provider-config.yaml"
apiVersion: aws.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: default
spec:
  credentials:
    source: Secret
    secretRef:
      namespace: crossplane-system
      name: aws-secret
      key: my-aws-secret
```
</TabItem>


<TabItem value="azure" label="Azure">

Next, create a new file called `provider-config.yaml` and paste the
configuration below:

```yaml title="upbound-hello-world/provider-config.yaml"
apiVersion: azure.upbound.io/v1beta1
metadata:
  name: default
kind: ProviderConfig
spec:
  credentials:
    source: Secret
    secretRef:
      namespace: crossplane-system
      name: azure-secret
      key: creds
```

</TabItem>


<TabItem value="gcp" label="GCP">

Next, create a new file called `provider-config.yaml` and paste the
configuration below:

<EditCode language="yaml">
{`
apiVersion: gcp.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: default
spec:
  projectID: $@<YOUR_GCP_PROJECT_ID>$@
  credentials:
    source: Secret
    secretRef:
      namespace: crossplane-system
      name: gcp-secret
      key: my-gcp-secret
`}
</EditCode>


</TabItem>

</Tabs>

Next, apply your provider configuration:

```shell
kubectl apply -f provider-config.yaml
```

When you create a composition and deploy with the control plane, Upbound uses
the `ProviderConfig` to locate and retrieve the credentials in the secret store.


<!-- vale Google.Will = NO -->
<!-- vale gitlab.FutureTense = NO -->
In this guide, you will create the
following resource types:
<!-- vale Google.Will = YES -->
<!-- vale gitlab.FutureTense = YES -->

<Tabs groupId="cloud-provider">
<TabItem value="aws" label="AWS">
* S3 Bucket
* S3 BucketACL
* S3 BucketOwnershipControls
* S3 BucketPublicAccessBlock
* S3 BucketServerSideEncryptionConfiguration
* S3 BucketVersioning
* S3 BucketObject
</TabItem>
<TabItem value="azure" label="Azure">
* ResourceGroup
* Storage Account
* Storage Container
* Storage Blob
</TabItem>
<TabItem value="gcp" label="GCP">
* Storage Bucket
* Storage BucketACL
* Storage BucketObject
</TabItem>
</Tabs>

## Deploy an example resource

The `examples/` directory in the project contains example resource manifests
that you can deploy to test your project. Deploy an example:

```shell
kubectl apply -f examples/storagebucket/example.yaml
```

Navigate to the "Composite Resources" tab in the Web UI and click "Relationship
View" to explore the cloud resources Crossplane creates.

## Update the custom resource type

You can add more fields to the `StorageBucket` type to customize its
behavior. For example, you may want create a README file in every bucket with
user-specified contents.

Open the example resource `examples/storagebucket/example.yaml` in your IDE of
choice and add a new field:

<Tabs groupId="cloud-provider">
<TabItem value="aws" label="AWS">
```yaml title="examples/storagebucket/example.yaml"
apiVersion: platform.example.com/v1alpha1
kind: StorageBucket
metadata:
  name: example
spec:
  parameters:
    region: us-west-1
    versioning: true
    acl: public-read
    readmeContents: This is a bucket.
```
</TabItem>
<TabItem value="azure" label="Azure">
```yaml title="examples/storagebucket/example.yaml"
apiVersion: platform.example.com/v1alpha1
kind: StorageBucket
metadata:
  name: example
spec:
  parameters:
    location: eastus
    versioning: true
    acl: public
    readmeContents: This is a bucket.
```
</TabItem>
<TabItem value="gcp" label="GCP">
```yaml title="examples/storagebucket/example.yaml"
apiVersion: platform.example.com/v1alpha1
kind: StorageBucket
metadata:
  name: example
spec:
  parameters:
    location: US
    versioning: true
    acl: publicRead
    readmeContents: This is a bucket.
```
</TabItem>
</Tabs>

Regenerate the Composite Resource Definition from the updated example. When
prompted, confirm the overwrite:

<Tabs groupId="cloud-provider">
<TabItem value="aws" label="AWS">
```shell
up xrd generate examples/storagebucket/example.yaml --path apis/storagebuckets/definition.yaml
```
</TabItem>
<TabItem value="azure" label="Azure">
```shell
up xrd generate examples/storagebucket/example.yaml
```
</TabItem>
<TabItem value="gcp" label="GCP">
```shell
up xrd generate examples/storagebucket/example.yaml
```
</TabItem>
</Tabs>

Update the `compose-bucket` function to create labels based on the new
field. Open `functions/compose-bucket/main.py` in your IDE of choice and update
its contents to the following:

<Tabs groupId="cloud-provider">
<TabItem value="aws" label="AWS">
```python title="functions/compose-bucket/main.py"
from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

from .model.io.k8s.apimachinery.pkg.apis.meta import v1 as metav1
from .model.com.example.platform.storagebucket import v1alpha1
from .model.io.upbound.aws.s3.bucket import v1beta1 as bucketv1beta1
from .model.io.upbound.aws.s3.bucketacl import v1beta1 as aclv1beta1
from .model.io.upbound.aws.s3.bucketownershipcontrols import v1beta1 as bocv1beta1
from .model.io.upbound.aws.s3.bucketpublicaccessblock import v1beta1 as pabv1beta1
from .model.io.upbound.aws.s3.bucketversioning import v1beta1 as verv1beta1
from .model.io.upbound.aws.s3.bucketobject import v1beta1 as objv1beta1
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

    # Return early if Crossplane hasn't observed the bucket yet. This means it
    # hasn't been created yet. This function will be called again after it is.
    if "bucket" not in req.observed.resources:
        return

    observed_bucket = bucketv1beta1.Bucket(**req.observed.resources["bucket"].resource)

    # The desired ACL, encryption, and versioning resources all need to refer to
    # the bucket by its external name, which is stored in its external name
    # annotation. Return early if the Bucket's external-name annotation isn't
    # set yet.
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

    desired_readme = objv1beta1.BucketObject(
        spec=objv1beta1.Spec(
            forProvider=objv1beta1.ForProvider(
                region=params.region,
                bucket=bucket_external_name,
                key="README",
                content=params.readmeContents,
                contentType="text/plain",
            ),
        )
    )
    resource.update(rsp.desired.resources["readme"], desired_readme)

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
</TabItem>
<TabItem value="azure" label="Azure">
```python
from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

from .model.io.k8s.apimachinery.pkg.apis.meta import v1 as metav1
from .model.io.upbound.azure.resourcegroup import v1beta1 as rgv1beta1
from .model.io.upbound.azure.storage.account import v1beta1 as acctv1beta1
from .model.io.upbound.azure.storage.container import v1beta1 as contv1beta1
from .model.io.upbound.azure.storage.blob import v1beta1 as blobv1beta1
from .model.com.example.platform.storagebucket import v1alpha1


def compose(req: fnv1.RunFunctionRequest, rsp: fnv1.RunFunctionResponse):
    observed_xr = v1alpha1.StorageBucket(**req.observed.composite.resource)
    params = observed_xr.spec.parameters

    # Create the resource group
    desired_group = rgv1beta1.ResourceGroup(
        spec=rgv1beta1.Spec(
            forProvider=rgv1beta1.ForProvider(
                location=params.location,
            ),
        ),
    )
    resource.update(rsp.desired.resources["rg"], desired_group)

    # Storage account names must be 3-24 character, lowercase alphanumeric
    # strings that are globally unique within Azure. We try to generate a valid
    # one automatically by deriving it from the XR name, which should always be
    # alphanumeric, lowercase, and separated by hyphens.
    account_external_name = observed_xr.metadata.name.replace("-", "")  # type: ignore  # Name is an optional field, but it'll always be set.

    # Create the storage account
    desired_acct = acctv1beta1.Account(
        metadata=metav1.ObjectMeta(
            name=account_external_name,
        ),
        spec=acctv1beta1.Spec(
            forProvider=acctv1beta1.ForProvider(
                accountTier="Standard",
                accountReplicationType="LRS",
                location=params.location,
                infrastructureEncryptionEnabled=True,
                blobProperties=[
                    acctv1beta1.BlobProperty(
                        versioningEnabled=params.versioning,
                    ),
                ],
                resourceGroupNameSelector=acctv1beta1.ResourceGroupNameSelector(
                    matchControllerRef=True
                ),
            ),
        ),
    )
    resource.update(rsp.desired.resources["account"], desired_acct)

    # Create the storage container
    desired_cont = contv1beta1.Container(
        spec=contv1beta1.Spec(
            forProvider=contv1beta1.ForProvider(
                containerAccessType="blob" if params.acl == "public" else "private",
                storageAccountNameSelector=contv1beta1.StorageAccountNameSelector(
                    matchControllerRef=True
                ),
            ),
        ),
    )
    resource.update(rsp.desired.resources["container"], desired_cont)

    if "container" not in req.observed.resources:
        return

    observed_container = contv1beta1.Container(**req.observed.resources["container"].resource)

    if observed_container.metadata is None or observed_container.metadata.annotations is None:
        return
    if "crossplane.io/external-name" not in observed_container.metadata.annotations:
        return

    container_external_name = observed_container.metadata.annotations[
        "crossplane.io/external-name"
    ]

    desired_readme = blobv1beta1.Blob(
        spec=blobv1beta1.Spec(
            forProvider=blobv1beta1.ForProvider(
                storageAccountNameSelector=blobv1beta1.StorageAccountNameSelector(
                    matchControllerRef=True
                ),
                storageContainerName=container_external_name,
                contentType="text/plain",
                sourceContent=params.readmeContents,
                type="Append",
            )
        )
    )
    resource.update(rsp.desired.resources["readme"], desired_readme)
```
</TabItem>
<TabItem value="gcp" label="GCP">
```python title="functions/compose-bucket/main.py"
from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

from .model.io.upbound.gcp.storage.bucket import v1beta1 as bucketv1beta1
from .model.io.upbound.gcp.storage.bucketacl import v1beta1 as aclv1beta1
from .model.io.upbound.gcp.storage.bucketobject import v1beta1 as objv1beta1
from .model.com.example.platform.storagebucket import v1alpha1


def compose(req: fnv1.RunFunctionRequest, rsp: fnv1.RunFunctionResponse):
    observed_xr = v1alpha1.StorageBucket(**req.observed.composite.resource)
    params = observed_xr.spec.parameters

    desired_bucket = bucketv1beta1.Bucket(
        spec=bucketv1beta1.Spec(
            forProvider=bucketv1beta1.ForProvider(
                location=params.location,
                versioning=[
                    bucketv1beta1.VersioningItem(
                        enabled=params.versioning,
                    )
                ],
            ),
        ),
    )
    resource.update(rsp.desired.resources["bucket"], desired_bucket)

    # Return early if Crossplane hasn't observed the bucket yet. This means it
    # hasn't been created yet. This function will be called again after it is.
    # We want the bucket to be created so we can refer to its external name.
    if "bucket" not in req.observed.resources:
        return

    observed_bucket = bucketv1beta1.Bucket(**req.observed.resources["bucket"].resource)

    # The desired ACL refers to the bucket by its external name, which is stored
    # in its external name annotation. Return early if the Bucket's
    # external-name annotation isn't set yet.
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
                bucket=bucket_external_name,
                predefinedAcl=params.acl,
            ),
        ),
    )
    resource.update(rsp.desired.resources["acl"], desired_acl)

    desired_readme = objv1beta1.BucketObject(
        spec=objv1beta1.Spec(
            forProvider=objv1beta1.ForProvider(
                bucket=bucket_external_name,
                name="README",
                contentType="text/plain",
                content=params.readmeContents,
            )
        )
    )
    resource.update(rsp.desired.resources["readme"], desired_readme)
```
</TabItem>
</Tabs>

Run the project again to install the updated XRD and function:

```shell
up project run --local
```

If you haven't already deployed an example resource, do so now:

```shell
kubectl apply -f examples/storagebucket/example.yaml
```

Use the Web UI to observe that Crossplane created the additional readme
resource, or list all the created resources:

```shell
kubectl get managed
```

## Clean up

To avoid leaving cloud resources behind, delete your `StorageBucket`:

```shell
kubectl delete -f examples/storagebucket/example.yaml
```

<!-- vale write-good.Passive = NO -->
Once the cloud resources are deleted, you can tear down the local control
plane:
<!-- vale write-good.Passive = YES -->

```shell
up project stop
```

## Do more with your control plane

The example above creates storage bucket resources whenever a `StorageBucket`
gets created. But what if you don't want to create buckets? The Upbound
Marketplace is the hub for finding additional packages to extend your control
plane, such as Providers, or pre-built Functions.

Your Upbound Crossplane control plane has an API server you can communicate
with, whether over a CLI, GitOps, GUI, or direct REST API calls.

[up]: /manuals/cli/overview
[provider authentication instructions]: /manuals/uxp/concepts/packages/provider-authentication
