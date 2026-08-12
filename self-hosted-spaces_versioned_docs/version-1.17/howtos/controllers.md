---
title: Controllers
weight: 250
description: A guide to how to wrap and deploy an Upbound controller into control planes on Upbound.
---
<!-- vale Google.We = NO -->
:::important
This feature is in private preview for select customers in Upbound Spaces. If you're interested in this feature, please [contact us](https://www.upbound.io/contact-us).
:::
<!-- vale Google.We = YES -->

Upbound's _Controllers_ feature lets you build and deploy control plane software from the Kubernetes ecosystem. With the _Controllers_ feature, you're not limited to just managing resource types defined by Crossplane. Now you can create resources from _CustomResourceDefinitions_ defined by other Kubernetes ecosystem tooling.

This guide explains how to bundle and deploy control plane software from the Kubernetes ecosystem on a control plane in Upbound.

## Benefits

The Controllers feature provides the following benefits:

* Deploy control plane software from the Kubernetes ecosystem.
* Use your control plane's package manager to handle the lifecycle of the control plane software and define dependencies between package.
* Build powerful compositions that combine both Crossplane and Kubernetes _CustomResources_.

<!-- vale gitlab.HeadingContent = NO -->
## How it works
<!-- vale gitlab.HeadingContent = YES -->

A _Controller_ is a package type that bundles control plane software from the Kubernetes ecosystem. Examples of such software includes:

- Kubernetes policy engines
- CI/CD tooling
- Your own private custom controllers defined by your organization

<!-- vale gitlab.SentenceLength = NO -->
You build a _Controller_ package by wrapping a helm chart along with its
requisite _CustomResourceDefinitions_. Your _Controller_ package gets pushed to
an OCI registry, and from there you can apply it to a control plane like you
would any other Crossplane package. The control plane's package manager manages
the lifecycle of the software once applied.
<!-- vale gitlab.SentenceLength = YES -->

## Prerequisites

Enable the Controllers feature in the Space you plan to run your control plane in:

- Cloud Spaces: Not available yet
- Connected Spaces: Space administrator must enable this feature
- Disconnected Spaces: Space administrator must enable this feature

Packaging a _Controller_ requires [up CLI][cli]  `v0.39.0` or later.

<!-- vale Google.Headings = NO -->
<!-- vale Microsoft.Headings = NO -->
## Build a _Controller_ package
<!-- vale Google.Headings = YES -->
<!-- vale Microsoft.Headings = YES -->

_Controllers_ are a package type that get administered by your control plane's package manager.

### Prepare the package

To define a _Controller_, you need a Helm chart. This guide assumes the control plane software you want to build into a _Controller_ already has a Helm chart available.

Start by making a working directory to assemble the necessary parts:

```ini
mkdir controller-package
cd controller-package
```

Inside the working directory, pull the Helm chart:

```shell
export CHART_REPOSITORY=<helm-chart-repo>
export CHART_NAME=<helm-chart-name>
export CHART_VERSION=<helm-chart-version>

helm pull $CHART_NAME --repo $CHART_REPOSITORY --version $CHART_VERSION
```

Be sure to update the Helm chart repository, name, and version with your own.

Move the Helm chart into its own folder:

```ini
mkdir helm
mv $CHART_NAME-$CHART_VERSION.tgz helm/chart.tgz
```

Unpack the CRDs from the Helm chart into their own directory:

```shell
export RELEASE_NAME=<helm-release-name>
export RELEASE_NAMESPACE=<helm-release-namespace>

mkdir crds
helm template $RELEASE_NAME helm/chart.tgz -n $RELEASE_NAMESPACE --include-crds | \
  yq e 'select(.kind == "CustomResourceDefinition")' - | \
  yq -s '("crds/" + .metadata.name + ".yaml")' -
```
Be sure to update the Helm release name, and namespace with your own.

:::info
The instructions above assume your CRDs get deployed as part of your Helm chart. If they're deployed another way, you need to manually copy your CRDs instead.
:::

Create a `crossplane.yaml` with your controller metadata:

```yaml
cat <<EOF > crossplane.yaml
apiVersion: meta.pkg.upbound.io/v1alpha1
kind: Controller
metadata:
  annotations:
    friendly-name.meta.crossplane.io: Controller <your-controller>
    meta.crossplane.io/description: |
      A brief description of what the controller does.
    meta.crossplane.io/license: Apache-2.0
    meta.crossplane.io/maintainer: <your-email>
    meta.crossplane.io/readme: |
      An explanation of your controller.
      meta.crossplane.io/source: <url-for-your-controller-source>
  name: <controller-name>
spec:
  packagingType: Helm
  helm:
    releaseName: <release-name>
    releaseNamespace: <release-namespace>
    # Value overrides for the helm release can be provided below.
    # values:
    #   foo: bar
EOF
```


The controller's file structure should look like this:

```ini
.
├── crds
│   ├── your-crd.yaml
│   ├── second-crd.yaml
│   └── another-crd.yaml
├── crossplane.yaml
└── helm
    └── chart.tgz
```

### Package and push the _Controller_

At the root of your controller's working directory, build the contents into an xpkg:

```ini
up xpkg build
```

This causes an xpkg to get saved to your current directory with a name like `controller-f7091386b4c0.xpkg`.

Push the package to your desired OCI registry:

```shell
export UPBOUND_ACCOUNT=<org-account-name>
export CONTROLLER_NAME=<controller-name>
export CONTROLLER_VERSION=<controller-version>
export XPKG_FILENAME=<controller-f7091386b4c0.xpkg>

up xpkg push xpkg.upbound.io/$UPBOUND_ACCOUNT/$CONTROLLER_NAME:$CONTROLLER_VERSION -f $XPKG_FILENAME
```

<!-- vale Google.Headings = NO -->
<!-- vale Microsoft.Headings = NO -->
## Deploy a _Controller_ package
<!-- vale Google.Headings = YES -->
<!-- vale Microsoft.Headings = YES -->

:::important
_Controllers_ are only installable on control planes running Crossplane `v1.19.0` or later.
:::

Set your kubecontext to the desired control plane in Upbound. Change the package path to the OCI registry you pushed it to. Then, deploy the _Controller_ directly:

```shell
export CONTROLLER_NAME=<controller-name>
export CONTROLLER_VERSION=<controller-version>

cat <<EOF | kubectl apply -f -
apiVersion: pkg.upbound.io/v1alpha1
kind: Controller
metadata:
  name: $CONTROLLER_NAME
spec:
  package: xpkg.upbound.io/$UPBOUND_ACCOUNT/$CONTROLLER_NAME:$CONTROLLER_VERSION
EOF
```

## Example usage

The example below demonstrates step-by-step how to package and deploy [Argo CD](https://argoproj.github.io/cd/) to a control plane in Upbound.

### Prepare to package Argo CD

Start by making a working directory to assemble the necessary parts:

```ini
mkdir argo-package
cd argo-package
```

Inside the working directory, pull the Helm chart

```shell
export CHART_REPOSITORY=https://argoproj.github.io/argo-helm
export CHART_NAME=argo-cd
export CHART_VERSION=7.8.8

helm pull $CHART_NAME --repo $CHART_REPOSITORY --version $CHART_VERSION
```

Move the Helm chart into its own folder:

```ini
mkdir helm
mv $CHART_NAME-$CHART_VERSION.tgz helm/chart.tgz
```

Unpack the CRDs from the Helm chart into their own directory:

```shell
export RELEASE_NAME=argo-cd
export RELEASE_NAMESPACE=argo-system

mkdir crds
helm template $RELEASE_NAME helm/chart.tgz -n $RELEASE_NAMESPACE --include-crds | \
  yq e 'select(.kind == "CustomResourceDefinition")' - | \
  yq -s '("crds/" + .metadata.name + ".yaml")' -
```

Create a `crossplane.yaml` with the controller metadata:

```yaml
cat <<EOF > crossplane.yaml
apiVersion: meta.pkg.upbound.io/v1alpha1
kind: Controller
metadata:
  annotations:
    friendly-name.meta.crossplane.io: Controller ArgoCD
    meta.crossplane.io/description: |
      The ArgoCD Controller enables continuous delivery and declarative configuration
      management for Kubernetes applications using GitOps principles.
    meta.crossplane.io/license: Apache-2.0
    meta.crossplane.io/maintainer: Upbound Maintainers <info@upbound.io>
    meta.crossplane.io/readme: |
      ArgoCD is a declarative GitOps continuous delivery tool for Kubernetes that
      follows the GitOps methodology to manage infrastructure and application
      configurations.
      meta.crossplane.io/source: https://github.com/argoproj/argo-cd
  name: argocd
spec:
  packagingType: Helm
  helm:
    releaseName: argo-cd
    releaseNamespace: argo-system
    # values:
    #   foo: bar
EOF
```

The controller's file structure should look like this:

```ini
.
├── crds
│   ├── applications.argoproj.io.yaml
│   ├── applicationsets.argoproj.io.yaml
│   └── appprojects.argoproj.io.yaml
├── crossplane.yaml
└── helm
    └── chart.tgz
```

### Package and push controller-argocd

At the root of your controller's working directory, build the contents into an xpkg:

```ini
up xpkg build
```

This causes an xpkg to get saved to your current directory with a name like `argocd-f7091386b4c0.xpkg`.

Push the package to your desired OCI registry:

```shell
export UPBOUND_ACCOUNT=<org-account-name>
export CONTROLLER_NAME=controller-argocd
export CONTROLLER_VERSION=v7.8.8
export XPKG_FILENAME=<controller-f7091386b4c0.xpkg>

up xpkg push --create xpkg.upbound.io/$UPBOUND_ACCOUNT/$CONTROLLER_NAME:$CONTROLLER_VERSION -f $XPKG_FILENAME
```

### Deploy controller-argocd to a control plane

Set your kubecontext to the desired control plane in Upbound. Change the package path to the OCI registry you pushed it to. Then, deploy the _Controller_ directly:

```ini
cat <<EOF | kubectl apply -f -
apiVersion: pkg.upbound.io/v1alpha1
kind: Controller
metadata:
  name: controller-argocd
spec:
  package: xpkg.upbound.io/$UPBOUND_ACCOUNT/controller-argocd:v7.8.8
EOF
```

Wait for the package to become ready:

```ini
watch kubectl get controllers.pkg
```

Check the pods in the `argo-system` namespace:

```ini
kubectl -n argo-system get pods
```

You can now use the _CustomResource_ types defined by Argo CD in your control plane.

<!-- vale off -->

## Frequently asked questions

<details>
<summary>Can I package any software or are there any prerequisites to be a Controller?</summary>

We define a *Controller* as a software that has at least one Custom Resource Definition (CRD) and a Kubernetes controller for that CRD. This is the minimum requirement to be a *Controller*. We have some checks to enforce this at packaging time.

</details>

<details>
<summary>How can I package my software as a Controller?</summary>

Currently, we support Helm charts as the underlying package format for *Controllers*. As long as you have a Helm chart, you can package it as a *Controller*.

If you don't have a Helm chart, you can't deploy the software. We only support Helm charts as the underlying package format for *Controllers*. We may extend this to support other packaging formats like Kustomize in the future.

</details>

<details>
<summary>Can I package Crossplane XRDs/Compositions as a Helm chart to deploy as a Controller?</summary>

This is not recommended. For packaging Crossplane XRDs/ and Compositions, we recommend using the `Configuration` package format. A helm chart only with Crossplane XRDs/Compositions does not qualify as a *Controller*.

</details>

<details>
<summary>How can I override the Helm values when deploying a Controller?</summary>

Overriding the Helm values is possible at two levels:
- During packaging time, in the package manifest file.
- At runtime, using a `ControllerRuntimeConfig` resource (similar to Crossplane `DeploymentRuntimeConfig`).

Create a `ControllerRuntimeConfig` with your Helm value overrides under
`spec.helm.values`, then reference it from the Controller via
`spec.runtimeConfigRef.name`. If you omit `runtimeConfigRef`, the Controller uses
the config named `default`.

Example of overriding replica count and image for a Controller at runtime:

```yaml
apiVersion: pkg.upbound.io/v1alpha1
kind: ControllerRuntimeConfig
metadata:
  name: example-controllerruntimeconfig
spec:
  helm:
    values:
      replicaCount: 2
      image:
        tag: "v1.2.3"
      # Add any other Helm chart values your controller chart supports
---
apiVersion: pkg.upbound.io/v1alpha1
kind: Controller
metadata:
  name: my-controller
spec:
  package: xpkg.upbound.io/your-org/your-controller:v1.0.0
  runtimeConfigRef:
    name: example-controllerruntimeconfig
```

</details>

<details>
<summary>How can I configure the helm release name and namespace for the controller?</summary>

Right now, it is not possible to configure this at runtime. The package author configures release name and namespace during packaging, so it is hardcoded inside the package. Unlike a regular application that is deployed by a Helm chart, *Controllers* can only be deployed once in a given control plane, so, we hope it should be ok to rely on predefined release names and namespaces. We may consider exposing these in `ControllerRuntimeConfig` later, but, we would like to keep it opinionated unless there are strong reasons to do so.

</details>

<details>
<summary>Can I deploy more than one instance of a Controller package?</summary>

No, this is not possible. Remember, a *Controller* package introduces CRDs which are cluster-scoped objects. Just like one cannot deploy more than one instance of the same Crossplane Provider package today, it is not possible to deploy more than one instance of a *Controller*.

</details>

<details>
<summary>Do I need a specific Crossplane version to run Controllers?</summary>

Yes, you need to use Crossplane v1.19.0 or later to use *Controllers*. This is because of the changes in the Crossplane codebase to support third-party package formats in dependencies.

Spaces `v1.12.0` supports Crossplane `v1.19` in the *Rapid* release channel.

</details>

<details>
<summary>Can I deploy Controllers outside of an Upbound control plane? With UXP?</summary>

No, *Controllers* are a proprietary package format and are only available for control planes running in Spaces hosting environments in Upbound.

</details>
<!-- vale on -->

[cli]: /manuals/uxp/overview
