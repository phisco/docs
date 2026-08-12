---
title: Use ArgoCD Plugin
sidebar_position: 15
description: A guide for integrating Argo with control planes in a Space.
aliases:
    - /all-spaces/self-hosted-spaces/use-argo
    - /deploy/disconnected-spaces/use-argo-flux
    - /all-spaces/self-hosted-spaces/use-argo-flux
    - /connect/use-argo
---



:::important
This feature is in preview and is off by default. To enable, set `features.alpha.argocdPlugin.enabled=true` when installing Spaces:

```bash
up space init --token-file="${SPACES_TOKEN_PATH}" "v${SPACES_VERSION}" \
  ...
  --set "features.alpha.argocdPlugin.enabled=true"
```
:::

Spaces provides an optional plugin to assist with integrating a control plane in a Space with Argo CD. You must enable the plugin for the entire Space at Spaces install or upgrade time. The plugin's job is to propagate the connection details of each control plane in a Space to Argo CD. By default, Upbound stores these connection details in a Kubernetes secret named after the control plane. To run Argo CD across multiple namespaces, Upbound recommends enabling the `features.alpha.argocdPlugin.useUIDFormatForCTPSecrets` flag to use a UID-based format for secret names to avoid conflicts.

:::tip
For general guidance on integrating Upbound with GitOps flows, see [GitOps with Control Planes][gitops-with-control-planes].
:::

## On cluster Argo CD

If you are running Argo CD on the same cluster as the Space, run the following to enable the plugin:


<Tabs>

<TabItem value="Up CLI" label="Up CLI">

```bash {hl_lines="3-4"}
up space init --token-file="${SPACES_TOKEN_PATH}" "v${SPACES_VERSION}" \
  --set "account=${UPBOUND_ACCOUNT}" \
  --set "features.alpha.argocdPlugin.enabled=true" \
  --set "features.alpha.argocdPlugin.useUIDFormatForCTPSecrets=true" \
  --set "features.alpha.argocdPlugin.target.secretNamespace=argocd"
```

</TabItem>

<TabItem value="Helm" label="Helm">

```bash {hl_lines="7-8"}
helm -n upbound-system upgrade --install spaces \
  oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version "${SPACES_VERSION}" \
  --set "ingress.host=${SPACES_ROUTER_HOST}" \
  --set "account=${UPBOUND_ACCOUNT}" \
  --set "features.alpha.argocdPlugin.enabled=true" \
  --set "features.alpha.argocdPlugin.useUIDFormatForCTPSecrets=true" \
  --set "features.alpha.argocdPlugin.target.secretNamespace=argocd" \
  --wait
```

</TabItem>

</Tabs>


The important flags are:

- `features.alpha.argocdPlugin.enabled=true`
- `features.alpha.argocdPlugin.useUIDFormatForCTPSecrets=true`
- `features.alpha.argocdPlugin.target.secretNamespace=argocd`

The first flag enables the feature and the second indicates the namespace on the cluster where you installed Argo CD.

Be sure to [configure Argo][configure-argo] after it's installed.

## External cluster Argo CD

If you are running Argo CD on an external cluster from where you installed your Space, you need to provide some extra flags:


<Tabs>

<TabItem value="Up CLI" label="Up CLI">

```bash {hl_lines="3-7"}
up space init --token-file="${SPACES_TOKEN_PATH}" "v${SPACES_VERSION}" \
  --set "account=${UPBOUND_ACCOUNT}" \
  --set "features.alpha.argocdPlugin.enabled=true" \
  --set "features.alpha.argocdPlugin.useUIDFormatForCTPSecrets=true" \
  --set "features.alpha.argocdPlugin.target.secretNamespace=argocd" \
  --set "features.alpha.argocdPlugin.target.externalCluster.enabled=true" \
  --set "features.alpha.argocdPlugin.target.externalCluster.secret.name=my-argo-cluster" \
  --set "features.alpha.argocdPlugin.target.externalCluster.secret.key=kubeconfig"
```

</TabItem>

<TabItem value="Helm" label="Helm">

```bash {hl_lines="7-11"}
helm -n upbound-system upgrade --install spaces \
  oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version "${SPACES_VERSION}" \
  --set "ingress.host=${SPACES_ROUTER_HOST}" \
  --set "account=${UPBOUND_ACCOUNT}" \
  --set "features.alpha.argocdPlugin.enabled=true" \
  --set "features.alpha.argocdPlugin.useUIDFormatForCTPSecrets=true" \
  --set "features.alpha.argocdPlugin.target.secretNamespace=argocd" \
  --set "features.alpha.argocdPlugin.target.externalCluster.enabled=true" \
  --set "features.alpha.argocdPlugin.target.externalCluster.secret.name=my-argo-cluster" \
  --set "features.alpha.argocdPlugin.target.externalCluster.secret.key=kubeconfig" \
  --wait
```

</TabItem>

</Tabs>

```bash
helm -n upbound-system upgrade --install spaces \
  oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version "${SPACES_VERSION}" \
  --set "ingress.host=${SPACES_ROUTER_HOST}" \
  --set "account=${UPBOUND_ACCOUNT}" \
  --set "features.alpha.argocdPlugin.enabled=true" \
  --set "features.alpha.argocdPlugin.useUIDFormatForCTPSecrets=true" \
  --set "features.alpha.argocdPlugin.target.secretNamespace=argocd" \
  --set "features.alpha.argocdPlugin.target.externalCluster.enabled=true" \
  --set "features.alpha.argocdPlugin.target.externalCluster.secret.name=my-argo-cluster" \
  --set "features.alpha.argocdPlugin.target.externalCluster.secret.key=kubeconfig" \
  --wait
```

The extra flags are:

- `features.alpha.argocdPlugin.target.externalCluster.enabled=true`
- `features.alpha.argocdPlugin.useUIDFormatForCTPSecrets=true`
- `features.alpha.argocdPlugin.target.externalCluster.secret.name=my-argo-cluster`
- `features.alpha.argocdPlugin.target.externalCluster.secret.key=kubeconfig`

These flags tell the plugin (running in Spaces) where your Argo CD instance is. After you've done this at install-time, you also need to create a `Secret` on the Spaces cluster. This secret must contain a kubeconfig pointing to your Argo CD instance. The secret needs to be in the same namespace as the `spaces-controller`, which is `upbound-system`.

Once you enable the plugin and configure it, the plugin automatically propagates connection details for your control planes to your Argo CD instance. You can then target the control plane and use Argo to sync Crossplane-related objects to it.

Be sure to [configure Argo][configure-argo-1] after it's installed.

## Configure Argo

Argo's default configuration causes it to try to query for resource kinds that don't exist in control planes. You should configure Argo's [general configmap][general-configmap] to include the resource group/kinds which make sense in the context of control planes. For example, the concept of `nodes` isn't exposed in control planes.

To configure Argo CD, connect to the cluster where you've installed it and edit the configmap:

```bash
kubectl edit configmap argocd-cm -n argocd
```

Adjust the resource inclusions and exclusions under the `data` field of the configmap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  resource.exclusions: |
    - apiGroups:
      - "*"
      kinds:
      - "*"
      clusters:
      - "*"
  resource.inclusions: |
    - apiGroups:
      - "*"
      kinds:
      - Provider
      - Configuration
      clusters:
      - "*"
```

The preceding configuration causes Argo to exclude syncing **all** resource group/kinds--except Crossplane `providers` and `configurations`--for **all** control planes. You're encouraged to adjust the `resource.inclusions` to include the types that make sense for your control plane, such as an `XRD` you've built with Crossplane. You're also encouraged to customize the `clusters` pattern to selectively apply these exclusions/inclusions to control planes (for example, `control-plane-prod-*`).

## Control plane connection secrets

To deploy control planes through Argo CD, you need to configure the `writeConnectionSecretToRef` field in your control plane spec. This field specifies where to store the control plane's `kubeconfig` and makes connection details available to Argo CD.

### Basic Configuration

In your control plane manifest, include the `writeConnectionSecretToRef` field:

```yaml
apiVersion: spaces.upbound.io/v1beta1
kind: ControlPlane
metadata:
  name: my-control-plane
  namespace: my-control-plane-group
spec:
  writeConnectionSecretToRef:
    name: kubeconfig-my-control-plane
    namespace: my-control-plane-group
  # ... other control plane configuration
```

### Parameters

The `writeConnectionSecretToRef` field requires two parameters:

- `name`: A unique name for the secret containing the kubeconfig (`kubeconfig-my-control-plane`)
- `namespace`: The Kubernetes namespace where you store the secret, which must match the metadata namespace. The system copies it into the `argocd` namespace when you set the `features.alpha.argocdPlugin.target.secretNamespace=argocd` configuration parameter.

Control plane labels automatically propagate to the connection secret, which allows you to use label selectors in Argo CD for automated discovery and management.

This configuration enables Argo CD to automatically discover and manage resources on your control planes.


[gitops-with-control-planes]: /cloud-spaces/howtos/gitops-on-upbound
[configure-argo]: #configure-argo
[configure-argo-1]: #configure-argo
[general-configmap]: https://argo-cd.readthedocs.io/en/stable/operator-manual/argocd-cm-yaml/
