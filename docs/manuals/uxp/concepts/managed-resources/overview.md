---
title: Overview
sidebar_position: 1
description: Managed resources are the Crossplane representation of external provider
  resources
---

A _managed resource_ (`MR`) represents an external service in a Provider. When
users create a new managed resource, the Provider reacts by creating an external 
resource inside the Provider's environment. Every external service managed by 
Crossplane maps to a managed resource. 

:::note
Crossplane calls the object inside Kubernetes a _managed resource_ and the
external object inside the Provider an _external resource_.
:::

Examples of managed resources include:
* Amazon AWS EC2 `Instance` defined in the [Official Provider for AWS][aws].
* Google Cloud GKE `Cluster` defined in the [Official Provider for GCP][gcp].
* Microsoft Azure PostgreSQL `Database` defined in [Official Provider for Azure][azure].

## Managed resource fields

The Provider defines the group, kind and version of a managed resource. The
Provider also defines the available settings of a managed resource.

### Group, kind and version
Each managed resource is a unique API endpoint with their own
group, kind and version. 

For example the [AWS Provider][aws]
defines the Instance kind from the
group ec2.aws.upbound.io

```yaml
apiVersion: ec2.aws.upbound.io/v1beta1
kind: Instance
```

### forProvider

The `spec.forProvider` of a 
managed resource maps to the parameters of the external resource. 

For example, when creating an AWS EC2 instance, the Provider supports defining 
the AWS region and the VM 
size, called the 
instanceType.

:::note
The Provider defines the settings and their valid values. Providers also define
required and optional values in the `forProvider` definition.

Refer to the documentation of your specific Provider for details.
:::

```yaml
apiVersion: ec2.aws.upbound.io/v1beta1
kind: Instance
# Removed for brevity
spec:
  forProvider:
    region: us-west-1
    instanceType: t2.micro
```

:::warning
Crossplane considers the `forProvider` field of a managed resource 
the "source of truth" for external resources. Crossplane overrides any changes 
made to an external resource outside of Crossplane. If a user makes a change 
inside a Provider's web console, Crossplane reverts that change back to what's
configured in the `forProvider` setting.
:::

#### Referencing other resources

Some fields in a managed resource may depend on values from other managed
resources. For example a VM may need the name of a virtual network to use. 

Managed resources can reference other managed resources by external name, name
reference or selector. 

##### Matching by external name

When matching a resource by name Crossplane looks for the name of the external
resource in the Provider. 

For example, a AWS VPC object named `test-vpc` has the external name
`vpc-01353cfe93950a8ff`.

```shell
kubectl get vpc
NAME            READY   SYNCED   EXTERNAL-NAME           AGE
test-vpc     True    True     vpc-01353cfe93950a8ff   49m
```

To match the VPC by name, use the external name. For example, creating a Subnet
managed resource attached to this VPC.

```yaml
apiVersion: ec2.aws.upbound.io/v1beta1
kind: Subnet
spec:
  forProvider:
    # Removed for brevity
    vpcId: vpc-01353cfe93950a8ff
```

##### Matching by name reference

To match a resource based on the name of the managed resource and not the
external resource name inside the Provider, use a `nameRef`.

For example, a AWS VPC object named `test-vpc` has the external name
`vpc-01353cfe93950a8ff`.

<!-- vale Google.FirstPerson = NO -->

```shell
kubectl get vpc
NAME            READY   SYNCED   EXTERNAL-NAME           AGE

test-vpc     True    True     vpc-01353cfe93950a8ff   49m

```

<!-- vale Google.FirstPerson = YES -->

To match the VPC by name reference, use the managed resource name. For example,
creating a Subnet managed resource attached to this VPC.

```yaml
apiVersion: ec2.aws.upbound.io/v1beta1
kind: Subnet
spec:
  forProvider:
    # Removed for brevity
    vpcIdRef: 
      name: test-vpc
```      

##### Matching by selector

Matching by selector is the most flexible matching method. 

Use `matchLabels` to match the labels applied to a resource. For example, this
Subnet resource only matches VPC resources with the label 
`test-label: label-value`.

```yaml
apiVersion: ec2.aws.upbound.io/v1beta1
kind: Subnet
spec:
  forProvider:
    # Removed for brevity
    vpcIdSelector: 
      matchLabels:
        test-label: label-value
```

##### Matching by controller reference 

Matching a controller reference ensures that the matching resource has the same
Kubernetes controller reference.

Matching helps trace resources composed by the same composite resource (XR).

:::note
Learn more about composite resources in the
[Composite Resources][xrs] section.
:::

Matching only a controller reference simplifies the matching process without
requiring labels or more information. 

For example, creating an AWS `InternetGateway` requires a `VPC`.

The `InternetGateway` could match a label, but every VPC created by this
Composition shares the same label. 

Using `matchControllerRef` matches only the VPC created in the same composite
resource that created the `InternetGateway`. 

#### Immutable fields

Some providers don't support changing the fields of some managed resources after
creation. For example, you can't change the `region` of an Amazon AWS
`RDSInstance`. These fields are _immutable fields_. Amazon requires you delete 
and recreate the resource.

Crossplane allows you to edit the immutable field of a managed resource, but
doesn't apply the change. Crossplane never deletes a resource based on a
`forProvider` change. 

<!-- vale write-good.Passive = NO -->
:::note
Crossplane behaves differently than other tools like Terraform. Terraform
deletes and recreates a resource to change an immutable field. Crossplane only
deletes an external resource if their corresponding managed 
resource object is deleted from Kubernetes.
:::
<!-- vale write-good.Passive = YES -->

#### Late initialization

Crossplane treats the managed resource as the source of truth by default;
it expects to have all values under `spec.forProvider` including the
optional ones. If not provided, Crossplane populates the empty fields with
the values assigned by the provider. For example, consider fields such as
`region` and `availabilityZone`. You might specify only the region and let the
cloud provider choose the availability zone. In this case, if the provider
assigns an availability zone, Crossplane uses that value to populate the
`spec.forProvider.availabilityZone` field.

:::note
With [managementPolicies][policies], you can turn this off by not including the
`LateInitialize` policy in the `managementPolicies` list.
:::

### initProvider

:::warning
The managed resource `initProvider` option is a beta feature related to
[managementPolicies][policies].
:::

The
initProvider defines
settings Crossplane applies only when creating a new managed resource.  
Crossplane ignores settings defined in the
initProvider
field that change after creation.

:::note
Settings in `forProvider` are always enforced by Crossplane. Crossplane reverts
any changes to a `forProvider` field in the external resource.

Settings in `initProvider` aren't enforced by Crossplane. Crossplane ignores any
changes to a `initProvider` field in the external resource.
:::

Using `initProvider` is useful for setting initial values that a Provider may
automatically change, like an auto scaling group.

For example, creating a
NodeGroup
with an initial
desiredSize.  
Crossplane doesn't change the
desiredSize
setting back when an autoscaler scales the Node Group external resource.

:::tip
Crossplane recommends configuring
managementPolicies without
`LateInitialize` to avoid conflicts with `initProvider` settings.
:::

```yaml
apiVersion: eks.aws.upbound.io/v1beta1
kind: NodeGroup
metadata:
  namespace: default
  name: sample-eks-ng
spec:
  managementPolicies: ["Observe", "Create", "Update", "Delete"]
  initProvider:
    scalingConfig:
      - desiredSize: 1
  forProvider:
    region: us-west-1
    scalingConfig:
      - maxSize: 4
        minSize: 1
```

### managementPolicies

:::note
The managed resource `managementPolicies` option is a beta feature. Crossplane enables
beta features by default. 

The Provider determines support for management policies.  
Refer to the Provider's documentation to see if the Provider supports
management policies.
:::

Crossplane
managementPolicies
determine which actions Crossplane can take on a
managed resource and its corresponding external resource.  
Apply one or more
managementPolicies
to a managed resource to determine what permissions
Crossplane has over the resource.

<!-- vale Google.Quotes = NO -->
For example, give Crossplane permission to create and delete an external resource,
but not make any changes, set the policies to
["Create", "Delete", "Observe"].
<!-- vale Google.Quotes = YES -->

```yaml
apiVersion: ec2.aws.upbound.io/v1beta1
kind: Subnet
spec:
  managementPolicies: ["Create", "Delete", "Observe"]
  forProvider:
    # Removed for brevity
```

The default policy grants Crossplane full control over the resources.  
Defining the `managementPolicies` field with an empty array [pauses](#paused)
the resource.

:::warning
The Provider determines support for management policies.  
Refer to the Provider's documentation to see if the Provider supports
management policies.
:::

Crossplane supports the following policies:

| Policy | Description |
| --- | --- |
| `*` | _Default policy_. Crossplane has full control over a resource. |
| `Create` | If the external resource doesn't exist, Crossplane creates it based on the managed resource settings. |
| `Delete` | Crossplane can delete the external resource when deleting the managed resource. |
| `LateInitialize` | Crossplane initializes some external resource settings not defined in the `spec.forProvider` of the managed resource. See [the late initialization](#late-initialization) section for more details. |
| `Observe` | Crossplane only observes the resource and doesn't make any changes. Used for observe only resources. |
| `Update` | Crossplane changes the external resource when changing the managed resource. |

### providerConfigRef

The `providerConfigRef` on a managed resource tells the Provider which
[ProviderConfig][providerconfig] to
use when creating the managed resource.  

Use a ProviderConfig to define the authentication method to use when 
communicating to the Provider.

:::warning
If `providerConfigRef` isn't applied, Providers use the ProviderConfig named `default`.
:::

For example, a managed resource references a ProviderConfig named 
user-keys.

This matches the name of a ProviderConfig.

```yaml
apiVersion: ec2.aws.upbound.io/v1beta1
kind: Instance
spec:
  forProvider:
    # Removed for brevity
  providerConfigRef: user-keys
```

```yaml
apiVersion: aws.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: user-keys
# Removed for brevity
```

:::tip
Each managed resource can reference different ProviderConfigs. This allows
different managed resources to authenticate with different credentials to the
same Provider.
:::

### writeConnectionSecretToRef

When a Provider creates a managed resource it may generate resource-specific
details, like usernames, passwords or connection details like an IP address. 

Crossplane stores these details in a Kubernetes Secret object specified by the
`writeConnectionSecretToRef` values. 

For example, when creating an AWS RDS database instance with the 
[Official Provider for AWS][official-provider-aws]
generates an endpoint, password, port and username data. The Provider saves
these variables in the Kubernetes secret 
rds-secret, referenced by
the 
writeConnectionSecretToRef
field. 

```yaml
apiVersion: database.aws.upbound.io/v1beta1
kind: RDSInstance
metadata:
  name: rds-instance
spec:
  forProvider:
  # Removed for brevity
  writeConnectionSecretToRef:
    name: rds-secret
```

Viewing the Secret object shows the saved fields.

```yaml
kubectl describe secret rds-secret
Name:         rds-secret
# Removed for brevity
Data
====
port:      4 bytes
username:  10 bytes
endpoint:  54 bytes
password:  27 bytes
```

:::warning
The Provider determines the data written to the Secret object. Refer to the
specific Provider documentation for the generated Secret data.
:::

## Annotations

Crossplane applies a standard set of Kubernetes `annotations` to managed
resources.

| Annotation | Definition | 
| --- | --- | 
| `crossplane.io/external-name` | The name of the managed resource inside the Provider. |
| `crossplane.io/external-create-pending` | The timestamp of when Crossplane began creating the managed resource. | 
| `crossplane.io/external-create-succeeded` | The timestamp of when the Provider successfully created the managed resource. | 
| `crossplane.io/external-create-failed` | The timestamp of when the Provider failed to create the managed resource. | 
| `crossplane.io/paused` | Indicates Crossplane isn't reconciling this resource. Read the [Pause Annotation](#paused) for more details. |

### Naming external resources
By default Providers give external resources the same name as the Kubernetes
object.

For example, a managed resource named 
test-rds-instance has
the name `test-rds-instance` as an external resource inside the Provider's
environment. 

```yaml
apiVersion: database.aws.upbound.io/v1beta1
kind: RDSInstance
metadata:
  namespace: default
  name: test-rds-instance
```

```shell
kubectl get rdsinstance
NAME                 READY   SYNCED   EXTERNAL-NAME        AGE
test-rds-instance      True    True     test-rds-instance      11m
```

Managed resource created with a `crossplane.io/external-name` 
annotation already provided use the annotation value as the external
resource name.

For example, the Provider creates managed resource named 
test-rds-instance but uses
the name test-custom-name
for the external resource inside AWS.

```yaml
apiVersion: database.aws.crossplane.io/v1beta1
kind: RDSInstance
metadata:
  namespace: default
  name: test-rds-instance  
  annotations: 
    crossplane.io/external-name: test-custom-name
```

```shell
kubectl get rdsinstance
NAME                 READY   SYNCED   EXTERNAL-NAME        AGE
test-rds-instance      True    True     test-custom-name       11m
```

### Creation annotations

<!-- vale write-good.Passive = NO -->
<!-- vale gitlab.SentenceLength = NO -->
When an external system like AWS generates nondeterministic resource names it's
possible for a provider to create a resource but not record that it did. When
this happens the provider can't manage the resource.
<!-- vale write-good.Passive = YES -->
<!-- vale gitlab.SentenceLength = YES -->

:::tip
Crossplane calls resources that a provider creates but doesn't manage _leaked
resources_.
:::

Providers set three creation annotations to avoid and detect leaked resources:

* crossplane.io/external-create-pending -
  The last time the provider was about to create the resource.
* crossplane.io/external-create-succeeded -
  The last time the provider successfully created the resource.
* `crossplane.io/external-create-failed` - The last time the provider failed to
  create the resource.

Use `kubectl get` to view the annotations on a managed resource. For example, an
AWS VPC resource:

```yaml
$ kubectl get -o yaml vpc test-vpc
apiVersion: ec2.aws.m.upbound.io/v1beta1
kind: VPC
metadata:
  namespace: default
  name: test-vpc
  annotations:
    crossplane.io/external-name: vpc-1234567890abcdef0
    crossplane.io/external-create-pending: "2023-12-18T21:48:06Z"
    crossplane.io/external-create-succeeded: "2023-12-18T21:48:40Z"
```

A provider uses the
crossplane.io/external-name
annotation to lookup a managed resource in an external system.

The provider looks up the resource in the external system to determine if it
exists, and if it matches the managed resource's desired state. If the provider
can't find the resource, it creates it.

Some external systems don't let a provider specify a resource's name when the
provider creates it. Instead the external system generates an nondeterministic
name and returns it to the provider.

When the external system generates the resource's name, the provider attempts to
save it to the managed resource's `crossplane.io/external-name` annotation. If
it doesn't, it _leaks_ the resource.

A provider can't guarantee that it can save the annotation. The provider could
restart or lose network connectivity between creating the resource and saving
the annotation.

A provider can detect that it might have leaked a resource. If the provider
thinks it might have leaked a resource, it stops reconciling it until you tell
the provider it's safe to proceed.

:::warning
Anytime an external system generates a resource's name there is a risk the
provider could leak the resource.

The safest thing for a provider to do when it detects a possible leaked
 resource is to stop and wait for human intervention.

This ensures the provider doesn't create duplicates of the leaked resource.
Duplicate resources can be costly and dangerous.
:::

When a provider thinks it might have leaked a resource it creates a `cannot
determine creation result` event associated with the managed resource. Use
`kubectl describe` to see the event.

```shell
kubectl describe queue test-sqs-queue

# Removed for brevity

Events:
  Type     Reason                           Age                 From                                 Message
  ----     ------                           ----                ----                                 -------
  Warning  CannotInitializeManagedResource  29m (x19 over 19h)  managed/queue.sqs.aws.m.crossplane.io  cannot determine creation result - remove the crossplane.io/external-create-pending annotation if it is safe to proceed
```

Providers use the creation annotations to detect that they might have leaked a
resource.

<!-- vale gitlab.SentenceLength = NO -->
Each time a provider reconciles a managed resource it checks the resource's
creation annotations. If the provider sees a create pending time that's more
recent than the most recent create succeeded or create failed time, it knows
that it might have leaked a resource.
<!-- vale gitlab.SentenceLength = YES -->

:::note
Providers don't remove the creation annotations. They use the timestamps to
determine which is most recent. It's normal for a managed resource to have
several creation annotations.
:::

The provider knows it might have leaked a resource because it updates all the
resource's annotations at the same time. If the provider couldn't update the
creation annotations after it created the resource, it also couldn't update the
`crossplane.io/external-name` annotation.

:::tip
If a resource has a `cannot determine creation result` error, inspect the
external system.

Use the timestamp from the `crossplane.io/external-create-pending` annotation to
determine when the provider might have leaked a resource. Look for resources
created around this time.

If you find a leaked resource, and it's safe to do so, delete it from the
external system.

Remove the `crossplane.io/external-create-pending` annotation from the managed
resource after you're sure no leaked resource exists. This tells the provider to
resume reconciliation of and recreate the managed resource.
:::

Providers also use the creation annotations to avoid leaking resources.

When a provider writes the `crossplane.io/external-create-pending` annotation it
knows it's reconciling the latest version of the managed resource. The write
would fail if the provider was reconciling an old version of the managed
resource.

If the provider reconciled an old version with an outdated
`crossplane.io/external-name` annotation it could mistakenly determine that the
resource didn't exist. The provider would create a new resource, and leak the
existing one.

Some external systems have a delay between when a provider creates a resource
and when the system reports that it exists. The provider uses the most recent
create succeeded time to account for this delay.

If the provider didn't account for the delay, it could mistakenly determine
that the resource didn't exist. The provider would create a new resource, and
leak the existing one.

### Paused
Manually applying the `crossplane.io/paused` annotation causes the Provider to
stop reconciling the managed resource. 

Pausing a resource is useful when modifying Providers or preventing
race-conditions when editing Kubernetes objects.

Apply a crossplane.io/paused: "true"
annotation to a managed resource to pause reconciliation. 

:::note
Only the value `"true"` pauses reconciliation.
:::

```yaml
apiVersion: ec2.aws.upbound.io/v1beta1
kind: Instance
metadata:
  namespace: default
  name: test-rds-instance
  annotations:
    crossplane.io/paused: "true"
spec:
  forProvider:
    region: us-west-1
    instanceType: t2.micro
```

Remove the annotation to resume reconciliation.

:::warning
Kubernetes and Crossplane can't delete resources with a `paused` annotation,
even with `kubectl delete`. 

Read 
[Crossplane discussion #4839][crossplane-discussion] 
for more details.
:::

## Finalizers
Crossplane applies a 
[Finalizer][k8s-finalizers]
on managed resources to control their deletion. 

:::note
Kubernetes can't delete objects with Finalizers.
:::

When Crossplane deletes a managed resource the Provider begins deleting the
external resource, but the managed resource remains until the external 
resource is fully deleted.

When the external resource is fully deleted Crossplane removes the Finalizer and
deletes the managed resource object.

## Conditions

Crossplane has a standard set of `Conditions` for a managed 
resource. View the `Conditions` of a managed resource with 
`kubectl describe <managed_resource>`

:::note
Providers may define their own custom `Conditions`.
:::

### Available
`Reason: Available` indicates the Provider created the managed resource and it's
ready for use. 

```yaml
Conditions:
  Type:                  Ready
  Status:                True
  Reason:                Available
```
### Creating

`Reason: Creating` indicates the Provider is attempting to create the managed
resource. 

```yaml
Conditions:
  Type:                  Ready
  Status:                False
  Reason:                Creating
```

### Deleting
`Reason: Deleting` indicates the Provider is attempting to delete the managed
resource. 

```yaml
Conditions:
  Type:                  Ready
  Status:                False
  Reason:                Deleting
```

### ReconcilePaused
`Reason: ReconcilePaused` indicates the managed resource has a [Pause](#paused)
annotation 

```yaml
Conditions:
  Type:                  Synced
  Status:                False
  Reason:                ReconcilePaused
```

### ReconcileError
`Reason: ReconcileError` indicates Crossplane encountered an error while
reconciling the managed resource. The `Message:` value of the `Condition` helps
identify the Crossplane error. 

```yaml
Conditions:
  Type:                  Synced
  Status:                False
  Reason:                ReconcileError
```

### ReconcileSuccess
`Reason: ReconcileSuccess` indicates the Provider created and is monitoring the 
managed resource.

```yaml
Conditions:
  Type:                  Synced
  Status:                True
  Reason:                ReconcileSuccess
```

### Unavailable
`Reason: Unavailable` indicates Crossplane expects the managed resource to be 
available, but the Provider reports the resource is unhealthy.

```yaml
Conditions:
  Type:                  Ready
  Status:                False
  Reason:                Unavailable
```

### Unknown
`Reason: Unknown` indicates the Provider has an unexpected error with the
managed resource. The `conditions.message` provides more information on what
went wrong. 

```yaml
Conditions:
  Type:                  Unknown
  Status:                False
  Reason:                Unknown
```

### Upjet Provider conditions
[Upjet][upjet], the open source tool to generate
Crossplane Providers, also has a set of standard `Conditions`.

#### AsyncOperation

Some resources may take more than a minute to create. Upjet based providers can 
complete their Kubernetes command before creating the managed resource by using 
an asynchronous operation. 

##### Finished 
The `Reason: Finished` indicates the asynchronous operation completed
successfully. 

```yaml
Conditions:
  Type:                  AsyncOperation
  Status:                True
  Reason:                Finished
```

##### Ongoing

`Reason: Ongoing` indicates the managed resource operation is still in progress. 

```yaml
Conditions:
  Type:                  AsyncOperation
  Status:                True
  Reason:                Ongoing
```

#### LastAsyncOperation

The Upjet `Type: LastAsyncOperation` captures the previous asynchronous
operation status as either `Success` or a failure `Reason`. 

##### ApplyFailure

`Reason: ApplyFailure` indicates the Provider failed to apply a setting to the
managed resource. The `conditions.message` provides more information on what
went wrong. 

```yaml
Conditions:
  Type:                  LastAsyncOperation
  Status:                False
  Reason:                ApplyFailure
```

##### DestroyFailure

`Reason: DestroyFailure` indicates the Provider failed to delete the managed
resource. The `conditions.message` provides more information on what
went wrong. 

```yaml
Conditions:
  Type:                  LastAsyncOperation
  Status:                False
  Reason:                DestroyFailure
```

##### Success
`Reason: Success` indicates the Provider successfully created the managed
resource asynchronously. 

```yaml
Conditions:
  Type:                  LastAsyncOperation
  Status:                True
  Reason:                Success
```

[policies]: /manuals/uxp/concepts/managed-resources/overview#managementpolicies
[providerconfig]: /manuals/uxp/concepts/packages/providers#provider-configuration
[official-provider-aws]: https://marketplace.upbound.io/providers/upbound/provider-family-aws
[official-provider-azure]: https://marketplace.upbound.io/providers/upbound/provider-family-azure
[official-provider-gcp]: https://marketplace.upbound.io/providers/upbound/provider-family-gcp
[aws]: https://marketplace.upbound.io/providers/upbound/provider-family-aws
[gcp]: https://marketplace.upbound.io/providers/upbound/provider-family-gcp
[azure]: https://marketplace.upbound.io/providers/upbound/provider-family-azure
[xrs]: /manuals/uxp/concepts/composition/composite-resources
[crossplane-discussion]: https://github.com/crossplane/crossplane/issues/4839
[k8s-finalizers]: https://kubernetes.io/docs/concepts/overview/working-with-objects/finalizers/
[upjet]: https://github.com/upbound/upjet
