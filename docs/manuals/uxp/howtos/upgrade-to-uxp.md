---
title: Upgrade Crossplane v2 to Upbound Crossplane
description: Adopt Upbound Crossplane from OSS Crossplane
sidebar_position: 2
---

import VersionSelector from '@site/src/components/VersionSelector';

<VersionSelector />

This guide explains how to upgrade from the Open-Source version of Crossplane
v2 to Upbound Crossplane (UXP) with both Community and Commercial licenses.

Upbound Crossplane (UXP) is the AI-native distribution of Crossplane by Upbound.
UXP builds on Crossplane v2.0 and maintains full compatibility with open-source
Crossplane. Use this guide when you want to upgrade to gain enhanced stability
and features like improved package management and observability.

## Prerequisites

:::important
To upgrade to Upbound Crossplane, your control plane **must** be running
Crossplane v2.0.1 or greater.

To upgrade an older version of Crossplane, refer to the [Crossplane upgrade
documentation][xp-upgrade] and come back to this guide when your control plane is v2.0.1 or
greater.

To determine your Crossplane version, use the `crossplane` CLI and look for the
`Server Version`:

```shell {copy-lines=1}
crossplane version
Client Version: v2.0.2
Server Version: v2.0.2
```
:::


<VersionSelector version="v2.0.1">


Before you begin, make sure you have:

* An actively supported [Kubernetes version](https://kubernetes.io/releases/patch-releases/#support-period)
* An existing OSS Crossplane v2.0.1 installation
* `kubectl` configured to access your cluster
* Helm version `v3.2.0` or later
* Cluster admin permissions
* A Commercial license key (for Commercial features only)


</VersionSelector>

<VersionSelector version="v2.0.2">

Before you begin, make sure you have:

* An actively supported [Kubernetes version](https://kubernetes.io/releases/patch-releases/#support-period)
* An existing OSS Crossplane v2.0.2 installation
* `kubectl` configured to access your cluster
* Helm version `v3.2.0` or later
* Cluster admin permissions
* A Commercial license key (for Commercial features only)

</VersionSelector>

:::important
Upbound recommends backing up your critical resources **before** beginning this process.
:::

## Version compatibility and breaking changes

Make sure you understand the version compatibility and breaking changes before
you begin your upgrade.


**Version compatibility**
When upgrading from OSS Crossplane, the target UXP version must match the Crossplane version up to the `-up.N` suffix:

- ❌ Crossplane `v2.0.1` → UXP `v2.1.1-up.N`
- ✅ Crossplane `v2.0.1` → UXP `v2.0.1-up.N`

To upgrade an older version of Crossplane to UXP, [upgrade
Crossplane][xp-upgrade] first and return when your control plane matches the
version of UXP.

**Breaking change**
You must now specify fully qualified package URLs:
- ❌ `package: provider-aws:v0.34.0`
- ✅ `package: xpkg.upbound.io/crossplane-contrib/provider-aws:v0.34.0`

Using fully qualified images was already a best practice, but Crossplane now
enforces this practice to avoid confusion and unexpected behavior. This ensures
users know which registry their packages use.

Before upgrading to Upbound Crossplane, please ensure all your Packages are
using fully qualified images that explicitly specify a registry
(`registry.example.com/repo/package:tag`).

## Verify packages and backup Crossplane resources

Prepare your environment for upgrade by verifying package configurations and
creating backups.

1. Review your existing Crossplane packages:
    ```shell
    # Check existing packages for fully qualified images
    kubectl get pkg
    ```

    The output should look like the following:

    ```shell-noCopy
    NAME                                                     INSTALLED   HEALTHY   PACKAGE                                           
    provider.pkg.crossplane.io/upbound-provider-aws-s3       True        True      xpkg.upbound.io/upbound/provider-aws-s3:v1.21.1   
    provider.pkg.crossplane.io/upbound-provider-family-aws   True        True      xpkg.upbound.io/upbound/provider-family-aws:v2.0.1
    ```

2. Review your existing Crossplane resources:
    ```shell
    # Backup all Crossplane configurations
    kubectl get configurations.pkg -o yaml > configurations-backup.yaml
    kubectl get providers.pkg -o yaml > providers-backup.yaml
    kubectl get functions.pkg -o yaml > functions-backup.yaml
    # Backup your claims and managed resources
    kubectl get claim -A -o yaml > claims-backup.yaml
    kubectl get managed -o yaml > managed-resources-backup.yaml
    ```

3. Verify your current Crossplane version and health:

    ```shell
    # Check current version
    helm list -n crossplane-system
    # Verify all resources are healthy
    kubectl get configurations.pkg
    kubectl get providers.pkg
    kubectl get functions.pkg
    ```

    Expected healthy state:
    - Configurations: `INSTALLED: True`, `HEALTHY: True`
    - Providers: `INSTALLED: True`, `HEALTHY: True`  
    - Functions: `INSTALLED: True`, `HEALTHY: True`
    - Claims: `SYNCED: True`, `READY: True`

4. Capture your critical cluster workloads that depend on Crossplane to plan for
   minimal disruption.

## Create a `ClusterAdmin`

Grant your control plane the ability to create the necessary Kubernetes
resources.

<!-- vale Google.WordList = NO -->
1. Create a _ClusterRoleBinding_:

    ```yaml
    apiVersion: rbac.authorization.k8s.io/v1
    kind: ClusterRoleBinding
    metadata:
      name: crossplane-clusteradmin
    roleRef:
      apiGroup: rbac.authorization.k8s.io
      kind: ClusterRole
      name: cluster-admin
    subjects:
    - kind: ServiceAccount
      name: crossplane
      namespace: crossplane-system
    ```

2. Save as `rbac.yaml` and apply it:

    ```shell
    kubectl apply -f rbac.yaml
    ```

<!-- vale Google.WordList  = YES -->
:::warning
The _ClusterRoleBinding_ gives full admin access to Crossplane. While this
is fine for development purposes, it's advised for production scenarios to be
diligent in what permissions you grant Crossplane. Only give it what's
necessary to create and manage the resources you need it to.
:::

<!-- vale Google.Headings = NO -->
## Upgrade to Community UXP
<!-- vale Google.Headings = YES -->

Moving from open source Crossplane to Community UXP provides enhanced stability
and features like improved package management and observability. This upgrade
path uses a **free Community license**.


1. Set version of UXP to install:

    <VersionSelector version="v2.0.1">

    ```shell
    export UXP_VERSION=2.0.1-up.1
    ```

    </VersionSelector>
    <VersionSelector version="v2.0.2">

    ```shell
    export UXP_VERSION=2.0.2-up.3
    ```

    </VersionSelector>

2. Choose your upgrade method and run the upgrade:

<Tabs groupId="upgrade-method">
<TabItem value="Helm Install">

Add the Upbound repository and upgrade your Crossplane cluster:
```shell
helm repo add upbound-stable https://charts.upbound.io/stable && helm repo update
helm upgrade --install crossplane --namespace crossplane-system upbound-stable/crossplane --version "${UXP_VERSION}"
```
</TabItem>

<TabItem value="Up CLI">

First, download the CLI:

```shell
curl -sL "https://cli.upbound.io" | sh
```

Next, upgrade your Crossplane cluster to UXP:

```shell
up uxp upgrade "${UXP_VERSION}"
```

</TabItem>
</Tabs>

<!-- vale Google.Headings = NO -->
## Upgrade to Commercial UXP
<!-- vale Google.Headings = YES -->

<!-- vale Google.We = NO -->
Moving from open source Crossplane to a Commercial UXP v2 provides production
level enterprise features like `ProviderVPA`, `Knative`, and enterprise support.
This upgrade path uses a **paid Commercial license**. Review our pricing plans
for more information.
<!-- vale Google.We = YES -->

1. Set version of UXP to install:

    <VersionSelector version="v2.0.1">

    ```shell
    export UXP_VERSION=2.0.1-up.1
    ```

    </VersionSelector>
    <VersionSelector version="v2.0.2">

    ```shell
    export UXP_VERSION=2.0.2-up.3
    ```

    </VersionSelector>

2. Choose your upgrade method and run the upgrade:

<Tabs groupId="upgrade-method">
<TabItem value="Helm Install">

Add the Upbound repository and upgrade your Crossplane cluster:
```shell
helm repo add upbound-stable https://charts.upbound.io/stable && helm repo update
helm upgrade --install crossplane --namespace crossplane-system upbound-stable/crossplane --version "${UXP_VERSION}"
```
</TabItem>

<TabItem value="Up CLI">

First, download the CLI:

```shell
curl -sL "https://cli.upbound.io" | sh
```

Next, upgrade your Crossplane cluster to UXP:

```shell
up uxp upgrade "${UXP_VERSION}"
```

</TabItem>
</Tabs>

3. Install your Commercial License:

    ```shell
    up uxp license apply /path/to/license.json
    ```

## Verify your upgrade

1. Check that all resources are healthy:
    ```bash

    kubectl get configurations.pkg
    kubectl get providers.pkg
    kubectl get functions.pkg
    kubectl get claim -A
    kubectl get managed
    ```

2. Verify your commercial features **(Commercial only)**:

    After applying the license, check for `VPA` resources:

    ```bash
    kubectl -n crossplane-system get vpa
    ```

    Provider revisions should be healthy:

    ```bash
    kubectl get providerrevisions.pkg
    ```

3. Verify function revision runtime update **(Commercial only)**:

    Function revisions should show healthy runtime status:

    ```bash
    kubectl get functionrevisions.pkg
    ```

    Expected output:
    
    ```
    NAME                                                           HEALTHY   RUNTIME   IMAGE                                                                    STATE    AGE
    crossplane-contrib-function-auto-ready-35bfe51b9ce9            True      True      xpkg.upbound.io/crossplane-contrib/function-auto-ready:v0.5.0            Active   16m
    crossplane-contrib-function-patch-and-transform-d000d8ce634a   True      True      xpkg.upbound.io/crossplane-contrib/function-patch-and-transform:v0.9.0   Active   17m
    ```

## Next steps

After upgrading to Upbound Crossplane, try out these features:

<!-- vale Google.We = NO -->
* The developer experience improvements with our [builders workshop][builders-workshop] 
* Browse all your managed resources with the [Crossplane Web UI][web-ui]
* Query resource states in real-time with [Upbound Query API][query-api]
* Leverage Intelligent Control Planes to [Dynamically scale an RDS Instance][rds]
* Join the [#Upbound channel on the Crossplane Slack][slack] for questions and support
<!-- vale Google.We = YES -->


[xp-upgrade]: https://docs.crossplane.io/latest/guides/upgrade-to-crossplane-v2/
[builders-workshop]: https://docs.upbound.io/getstarted/builders-workshop/project-foundations/
[web-ui]: https://docs.upbound.io/manuals/console/self-service/#key-features
[query-api]: https://docs.upbound.io/manuals/console/query-api/
[rds]: https://docs.upbound.io/guides/intelligent-control-planes/scale-database/
[slack]: https://crossplane.slack.com/archives/C01TRKD4623

