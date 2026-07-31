---
title: 5. Build and push your first Configuration
description: Package your control plane and share it via the Upbound Marketplace
---

<!-- vale gitlab.FutureTense = NO -->
In this tutorial, you'll learn how to build a Configuration package and push it
to the Upbound Marketplace.
<!-- vale gitlab.FutureTense = YES -->

<!-- vale gitlab.FutureTense = NO -->
By the end of this tutorial, you'll be able to:

* Sign in to Upbound using the CLI
* Create repositories in your Upbound organization
* Build Configuration packages
* Push packages to the Upbound Marketplace
<!-- vale gitlab.FutureTense = YES -->

## Prerequisites

Before you begin, make sure you have:

* an Upbound account
* The `up` CLI installed
* A control plane project ready to package

If you missed any of the previous steps, go to the [project
foundations][project-foundations] guide to get started.

## Sign in to Upbound

To push the Configuration package, you need to sign in with your Upbound
account. Run the following to log in with the `up` CLI:

```sh
up login
```

This command opens a browser and prompts you to sign in with your Upbound
credentials.

## Create a repository

To create a repository in Upbound with the `up` CLI, run the following:

```sh
up repository create getting-started
```

This command creates a new repository called `getting-started` in your Upbound
account where you can store you Configuration packages.

## Build and push the Configuration

Now that you have a repository, you are ready to build and push your
Configuration. Run the following to build:

```sh
up project build
```

Push your project to your repository:

```shell
up project push
```

This command builds an OCI image that contains your control plane configuration
and pushing the image to your Upbound repository.

## Components 

### Configuration images

Configurations are packaging formats that contain everything Upbound needs to
run a control plane. Configuration packages use the OCI image format like
Kubernetes and Docker container images. 

Configurations include:

* APIs the control plane offers
* specifications of the control plane
* dependencies like providers or functions

Packaging configurations allows you to distribute your control planes and share
them with others.

### Repositories

Like container images, you need a place to store Configurations. Upbound is the
default [repository][repositories] source. Upbound provides:

* A centralized place to store these images
* Automatic API documentation generated for packages.
* A convenient publishing experience to share with the community via the Upbound Marketplace, if desired.


## Summary

In this tutorial you learned how to:

* Sign in to your Upbound organization with the `up` CLI
* Create a repository to store your Configuration packages
* Build and push a Configuration to the Upbound Marketplace

[Upbound Marketplace][marketplace] is the go-to location for finding trusted content. The
Marketplace also serves as a place to distribute your own control plane
extensions.

## Next steps

Continue the workshop with [Create an AI-augmented operation][integrate-ai] to
add AI-powered monitoring to your control plane.

[project-foundations]: /getstarted/builders-workshop/project-foundations
[configurations]: /manuals/uxp/concepts/packages/configurations
[repositories]: /manuals/marketplace/repositories/overview
[marketplace]: https://marketplace.upbound.io/
[integrate-ai]: /getstarted/builders-workshop/integrate-ai
