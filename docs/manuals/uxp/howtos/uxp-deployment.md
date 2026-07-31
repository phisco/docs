---
title: Deploy UXP
description: "Learn best practices for UXP in your production environment"
sidebar_position: 1
---

Upbound Crossplane requires a Kubernetes cluster. You can run Upbound Crossplane
in any Kubernetes environment, such as a managed Kubernetes service or in bare-metal environments. Upbound recommends using Helm to install a
self-managed instance of Upbound Crossplane.

:::tip

Looking for a managed Crossplane experience? Read about running Upbound Crossplane in a [Spaces environment][spaces]

:::

## Install Upbound Crossplane

<Tabs>
<TabItem value="Helm" label="Helm">


1. Add the `upbound-stable` chart repository:
```bash
helm repo add upbound-stable https://charts.upbound.io/stable && helm repo update
```
2. Install Upbound Crossplane:
```bash
helm install crossplane --namespace crossplane-system --create-namespace upbound-stable/crossplane --devel
```

:::note

Helm requires the use of `--devel` flag for versions with suffixes, like `v2.0.0-up.1`. The Helm repository Upbound uses is the stable repository, so use of that flag is only a workaround. You will always get the latest stable version of Upbound Crossplane.

:::

</TabItem>
<TabItem value="up CLI" label="up CLI">

Make sure you have the up CLI installed and that your current kubeconfig context is pointed at the desired Kubernetes cluster, then run the following command:
```bash
up uxp install
```

</TabItem>
</Tabs>

## Upgrade from open source Crossplane
:::important
**Version Upgrade Rule**: To meet the [upstream Crossplane
needs](https://github.com/crossplane/crossplane/discussions/4569#discussioncomment-11836395),
ensure there is **at most one minor version difference for Crossplane versions**
during upgrades.
:::

To upgrade from upstream Crossplane, the target UXP version should match the
Crossplane version until the `-up.N` suffix. You can increment at most one minor
version between Crossplane versions to follow
upstream guidelines.

**Examples:**
- ✅ **Allowed**: Crossplane `v2.0.1` → UXP `v2.0.1-up.N` (same Crossplane version)
- ✅ **Allowed**: Crossplane `v2.0.1` → UXP `v2.1.0-up.N` (one minor version diff in Crossplane)
- ✅ **Allowed**: Crossplane `v2.0.1` → UXP `v2.0.5-up.N` (multiple patch versions allowed)
- ❌ **Not allowed**: Crossplane `v2.0.1` → UXP `v2.2.0-up.N` (two minor version diff in Crossplane)

**Required upgrade path for larger Crossplane version gaps:**

If you want to upgrade from Crossplane `v2.0.1` to UXP `v2.2.1-up.N`, follow this incremental approach to meet
upstream requirements:
1. Crossplane `v2.0.1` → UXP `v2.1.0-up.N`
2. UXP `v2.1.0-up.N` → UXP `v2.2.1-up.N`

<Tabs>
<TabItem value="Helm" label="Helm">

```bash
helm upgrade crossplane --namespace crossplane-system upbound-stable/crossplane --devel
```

</TabItem>
<TabItem value="up CLI" label="up CLI">

```bash
up uxp upgrade -n crossplane-system
```

</TabItem>
</Tabs>

For more information on upgrading to UXP, review the [upgrade guide][migration]

## Add a license to enable commercial features

Read [license management][license-management] to learn how to add a license to unlock commercial features in Upbound Crossplane.

[spaces]: /self-hosted-spaces/overview
[migration]: /manuals/uxp/howtos/upgrade-to-uxp
[license-management]: /manuals/uxp/howtos/license-management
