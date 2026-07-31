---
title: Interacting with Disconnected Spaces
sidebar_position: 10
description: Common operations in Spaces
draft: true
---


## Create a Space

To install an Upbound Space into a cluster, it's recommended you dedicate an
entire Kubernetes cluster for the Space. You can use [up space
init][up-space-init] to install an Upbound Space. Below is an example:

```bash
up space init "v1.13.5"
```
:::tip
For a full guide to get started with Spaces, read the [quickstart][quickstart] guide:
:::

The Spaces chart requires a pull secret, which Upbound must provide to you.

```bash
helm -n upbound-system upgrade --install spaces \
  oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version "v1.13.5" \
  --set "ingress.host=your-host.com" \
  --set "clusterType=eks" \
  --set "account=your-upbound-account" \
  --wait
```
For a complete tutorial of the helm install, read one of the deployment guides for [AWS][aws], [Azure][azure] , or [GCP][gcp] which cover the step-by-step process.

## Upgrade a Space

To upgrade a Space from one version to the next, use [up space upgrade][up-space-upgrade]. Spaces supports upgrading from version `ver x.N.*` to version `ver x.N+1.*`.

```bash
up space upgrade "v1.13.5"
```

You can also upgrade a Space by manually bumping the Helm chart version. Before
upgrading, review the release notes for any breaking changes or
special requirements:

1. Review the release notes for the target version in the [Spaces Release Notes][spaces-release-notes]
2. Upgrade the Space by updating the helm chart version:

```bash
helm -n upbound-system upgrade spaces \
  oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version "v1.13.5" \
  --reuse-values \
  --wait
```

For major version upgrades or configuration changes, extract your current values
and adjust:

```bash
# Extract current values to a file
helm -n upbound-system get values spaces > spaces-values.yaml

# Upgrade with modified values
helm -n upbound-system upgrade spaces \
  oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version "v1.13.5" \
  -f spaces-values.yaml \
  --wait
```

## Downgrade a Space

To rollback a Space from one version to the previous, use [up space upgrade][up-space-upgrade-1]. Spaces supports downgrading from version `ver x.N.*` to version `ver x.N-1.*`.

```bash
up space upgrade --rollback
```

You can also downgrade a Space manually using Helm by specifying an earlier version:

```bash
helm -n upbound-system upgrade spaces \
  oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version "v1.13.4" \
  --reuse-values \
  --wait
```

When downgrading, make sure to:
1. Check the [release notes][release-notes] for specific downgrade instructions
2. Verify compatibility between the downgraded Space and any control planes
3. Back up any critical data before proceeding

## Uninstall a Space

To uninstall a Space from a Kubernetes cluster, use [up space destroy][up-space-destroy]. A destroy operation uninstalls core components and orphans control planes and their associated resources.

```bash
up space destroy
```

## Control plane management

You can manage control planes in a Space via the [up CLI][up-cli] or the Spaces-local Kubernetes API. When you install a Space, it defines new a API type, `kind: Controlplane`, that you can use to create and manage control planes in the Space.

### Create a control plane

To create a control plane in a Space using `up`, run the following:

```bash
up ctp create ctp1
```

You can also declare a new control plane like the example below and apply it to your Spaces cluster:

```yaml
apiVersion: spaces.upbound.io/v1beta1
kind: ControlPlane
metadata:
  name: ctp1
  namespace: default
spec:
  writeConnectionSecretToRef:
    name: kubeconfig-ctp1
    namespace: default
```

This manifest:

- Creates a new control plane in the space called `ctp1`.
- Publishes the kubeconfig to connect to the control plane to a secret in the Spaces cluster, called `kubeconfig-ctp1`

### Connect to a control plane

To connect to a control plane in a Space using `up`, run the following:

```bash
up ctx ./default/new-control-plane
```

The command changes your kubeconfig's current context to the control plane you specify. If you want to change your kubeconfig back to a previous context, run:

```bash
up ctx -
```

If you configured your control plane to publish connection details, you can also
access it this way. Once the control plane is ready, use the secret (containing
connection details) to connect to the API server of your control plane.

```bash
kubectl get secret <control-plane-connection-secret-name> -n default -o jsonpath='{.data.kubeconfig}' | base64 -d > /tmp/<ctp-name>.yaml
```

Reference the kubeconfig whenever you want to interact directly with the API
server of the control plane (vs the Space's API server):

```bash
kubectl get providers --kubeconfig=/tmp/<ctp-name>.yaml
```

### Configure a control plane

Spaces offers a built-in feature that allows you to connect a control plane to a
Git source. This experience is like when a control plane runs in [Upbound's SaaS
environment][upbound-s-saas-environment]. Upbound recommends using the built-in
Git integration to drive configuration of your control planes in a Space.

Learn more in the [Spaces Git integration][spaces-git-integration] documentation.

### List control planes

To list all control planes in a Space using `up`, run the following:

```bash
up ctp list
```

Or you can use Kubernetes-style semantics to list the control plane:

```bash
kubectl get controlplanes
```


### Delete a control plane

To delete a control plane in a Space using `up`, run the following:

```bash
up ctp delete ctp1
```

Or you can use Kubernetes-style semantics to delete the control plane:

```bash
kubectl delete controlplane ctp1
```


[up-space-init]: /reference/cli-reference
[quickstart]: /self-hosted-spaces/self-hosted-spaces-quickstart
[aws]: /self-hosted-spaces/howtos/self-hosted-spaces-deployment 
[azure]:/self-hosted-spaces/howtos/self-hosted-spaces-deployment  
[gcp]:/self-hosted-spaces/howtos/self-hosted-spaces-deployment  
[up-space-upgrade]: /reference/cli-reference
[spaces-release-notes]: /reference/release-notes/spaces
[up-space-upgrade-1]: /reference/cli-reference
[release-notes]: /reference/release-notes/spaces
[up-space-destroy]: /reference/cli-reference
[up-cli]: /reference/cli-reference
[upbound-s-saas-environment]: /self-hosted-spaces/howtos/spaces-management
[spaces-git-integration]: /self-hosted-spaces/howtos/gitops
