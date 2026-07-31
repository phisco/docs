---
title: 1. Project Foundations
description: Create a new project from scratch
---

This workshop walks through how to create a brand new project and
understand each component's purpose as you build your resources from scratch.

## Prerequisites

Make sure you have:

* [The Up CLI installed][up-cli]
* [kubectl installed][kubectl-installed]
* [Docker Desktop][docker-desktop] running

## Initialize a new project

An Upbound project is the foundation for creating and managing infrastructure
APIs. Projects contain all the definitions and configurations needed to build a
control plane.

```shell
up project init upbound-hello-world --scratch && cd upbound-hello-world
```

This command:

* Creates a new directory called `upbound-hello-world`
* Sets up the basic project structure with necessary configuration files

### Review the project structure


#### `upbound.yaml`

The `upbound.yaml` file is the main configuration that:

* Defines project metadata (name, organization)
* Sets configuration parameters for builds and deployments

This file is the project entry point and tells Upbound what this
project is and where it belongs.

#### `apis/` directory

The `apis/` directory is for your custom resource definitions and compositions.

* **XRDs (Composite Resource Definitions)**: Define your custom resource APIs
* **Compositions**: Define the API implementation logic

#### `examples/` directory

The `examples/` directory is for composite resources (XRs). XRs are abstractions of your APIs
that allow your users to request resources.

## Add project dependencies

Next, you need to add dependencies. Dependencies are the providers that connect
to actual cloud resources:

<Tabs groupId="cloud-provider">
<TabItem value="aws" label="AWS">

```shell
up dependency add 'xpkg.upbound.io/upbound/provider-aws-s3:>=v2.0.0'
```

</TabItem>
<TabItem value="azure" label="Azure">

```shell
up dependency add 'xpkg.upbound.io/upbound/provider-azure-storage:>=v2.0.0'
```

</TabItem>
<TabItem value="gcp" label="GCP">

```shell
up dependency add 'xpkg.upbound.io/upbound/provider-gcp-storage:>=v2.0.0'
```

</TabItem>
</Tabs>
<!-- vale Microsoft.HeadingPunctuation = NO -->
### What are providers and why do you need them?

<!-- vale Microsoft.HeadingPunctuation = YES -->
Providers are packages that:

* Connect your control plane to specific cloud platforms (AWS, Azure, GCP)
* Contain the resource types available on those platforms (S3 buckets, VMs, databases)
* Handle authentication and communication with cloud APIs
* Manage the lifecycle of cloud resources

When you add a provider to your project, Upbound:

* Makes those cloud resources available for your compositions
* Specifies which version of the provider to use
* Ensures correct configuration when you deploy

Without providers, your control plane would have no way to create actual
resources. 

<!-- vale Microsoft.HeadingAcronyms = NO -->
## Create an XR and generate your API
<!-- vale Microsoft.HeadingAcronyms = YES -->

Now that you have a project with dependencies, you need to define what users can request through your API:

```shell
up example generate \
    --type xr \
    --api-group platform.example.com \
    --api-version v1alpha1 \
    --kind StorageBucket \
    --name example \
    --namespace default \
    --scope namespace
```

This command generates a sample XR (request) for a specific resource type and
creates a template for how users can interact with your API.

Open your new XR file in
`upbound-hello-world/examples/storagebucket/example.yaml`.

Your XR file maps each flag you specified as a Kubernetes resource. The
`spec{}` field is empty for now. You need to create the specifications
you want to apply to this `StorageBucket` resource. 

Paste this XR into your XR file:

<Tabs groupId="cloud-provider">
<TabItem value="aws" label="AWS">

```yaml title="upbound-hello-world/examples/storagebucket/example.yaml"
apiVersion: platform.example.com/v1alpha1
kind: StorageBucket
metadata:
    name: example
    namespace: default
spec:
    parameters:
        region: us-west-1
        versioning: true
        acl: public-read
```

</TabItem>
<TabItem value="azure" label="Azure">

```yaml title="upbound-hello-world/examples/storagebucket/example.yaml"
apiVersion: platform.example.com/v1alpha1
kind: StorageBucket
metadata:
    name: example
    namespace: default
spec:
    parameters:
        location: eastus
        versioning: true
        acl: public
```
</TabItem>
<TabItem value="gcp" label="GCP">

```yaml title="upbound-hello-world/examples/storagebucket/example.yaml"
apiVersion: platform.example.com/v1alpha1
kind: StorageBucket
metadata:
    name: example
    namespace: default
spec:
    parameters:
        location: US
        versioning: true
        acl: publicRead
```

</TabItem>
</Tabs>

Your `spec` now contains a new `parameters` field. The `parameters` are the
variables you expose to the user when they want to create a new resource. These
parameters depend on the resource type you want to create. This `StorageBucket`
XR uses fields AWS requires to create an S3 bucket instance. You can discover
required fields in the Marketplace for the provider.


### Define your API

Next, you need to generate Composite Resource Definition (XRD) based on the
XR you create.

An XRD (Composite Resource Definition) defines the schema and behavior of your API.

XRDs:

* Define the "contract" between your users and your infrastructure
* Specify what parameters users can set (like bucket size or region)
* Validate user inputs to ensure they meet requirements
* Establish ownership and lifecycle management for resources
* Create a consistent, declarative interface for infrastructure

XRDs are the blueprint of your API. They describe what users can request and
define requirements for the resource.

Generate a new XRD based on your example XR:

```shell
up xrd generate examples/storagebucket/example.yaml
```

`up xrd generate` infers the variable
types for the XRD based on the input parameters of your XR.


### Create a composition


Next, you need to create a composition to define your resource.

```shell
up composition generate apis/storagebuckets/definition.yaml
```
<!-- vale Microsoft.HeadingPunctuation = NO -->
#### Why create a composition?
<!-- vale Microsoft.HeadingPunctuation = YES -->

Compositions define how user requests (XRs) become actual resources:

* They map user parameters to specific cloud resources
* They handle relationships between resources (like a database and its subnet)
* They apply best practices and organizational policies automatically
* They abstract away cloud-specific details from users

Without compositions, your XRDs would define an API that doesn't do anything.
Compositions are where the actual implementation happens.

## Next steps

Now that you've set up your project foundation with:

* A project directory
* Cloud provider dependencies
* API definitions (XRDs)
* Implementation logic (Compositions)

You're ready to enhance your control plane with custom logic. The next guide
walks through how to create a composition function that adds advanced
capabilities to your infrastructure API.

[up-account]: https://www.upbound.io/register/?utm_source=docs&utm_medium=cta&utm_campaign=docs_get_started
[up-cli]: /manuals/cli/overview
[kubectl-installed]: https://kubernetes.io/docs/tasks/tools/
[docker-desktop]: https://www.docker.com/products/docker-desktop/
