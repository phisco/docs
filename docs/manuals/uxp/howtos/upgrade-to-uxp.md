---
title: Upgrade Crossplane v2 to Upbound Crossplane
description: Adopt Upbound Crossplane from OSS Crossplane
sidebar_position: 2
---

This guide explains how to upgrade a control plane you run from the
Open-Source version of Crossplane v2 to Upbound Crossplane (UXP).

Upbound Crossplane (UXP) is the AI-native distribution of Crossplane by Upbound.
UXP builds on Crossplane v2.0 and maintains full compatibility with open source
Crossplane. Use this guide when you want to upgrade to gain enhanced stability
and features like improved package management and observability. Once you've
upgraded, this guide also connects your control plane to a Hub for centralized
visibility across every control plane you run.

To try the upgrade on local kind clusters first, follow the [upgrade
quickstart][upgrade-qs].

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
Client Version: v2.3.4
Server Version: v2.3.4
```
:::

Before you begin, make sure you have:

* An actively supported [Kubernetes version](https://kubernetes.io/releases/patch-releases/#support-period)
* An existing OSS Crossplane installation on one of the versions in the
  [version compatibility](#version-compatibility-and-breaking-changes) table below
* `kubectl` configured to access your cluster
* Helm version `v3.2.0` or later
* Cluster admin permissions
* A Commercial license key (for Commercial features only)

:::important
Upbound recommends backing up your critical resources **before** beginning this process.
:::

## Version compatibility and breaking changes

Make sure you understand the version compatibility and breaking changes before
you begin your upgrade.


**Version compatibility**
When upgrading from OSS Crossplane, the target UXP version must match the Crossplane version up to the `-up.N` suffix:

- ❌ Crossplane `v2.3.4` → UXP `v2.4.0-up.N`
- ✅ Crossplane `v2.3.4` → UXP `v2.3.4-up.N`

Find the row matching your Crossplane version and use its UXP version for
`UXP_VERSION` in the upgrade steps below:

| Crossplane version | UXP version |
| --- | --- |
| v2.1.x | `2.1.8-up.2` |
| v2.2.x | `2.2.4-up.2` |
| v2.3.x | `2.3.4-up.2` |

See the [UXP release notes][uxp-release-notes] for the full list of patch
releases within each line.

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
    # Backup your composite and managed resources
    kubectl get composite -A -o yaml > composites-backup.yaml
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
    - Composite resources: `SYNCED: True`, `READY: True`

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
## Upgrade to UXP
<!-- vale Google.Headings = YES -->

<!-- vale Google.We = NO -->
Moving from open source Crossplane to UXP v2 provides production level
enterprise features like `ProviderVPA`, `Knative`, and enterprise support.
Applying a Commercial license unlocks those features. Review our pricing plans
for more information.
<!-- vale Google.We = YES -->

1. Set the UXP version to install. Replace the value with the version
   matching your Crossplane version from the [version compatibility
   table](#version-compatibility-and-breaking-changes) above:

    <EditCode language="shell">
    {`
    export UXP_VERSION=$@2.3.4-up.2$@
    `}
    </EditCode>

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

3. Install your Commercial license:

    ```shell
    up uxp license apply /path/to/license.json
    ```

    Without a license, UXP runs with commercial features locked. You can apply
    a license at any time after the upgrade.

## Verify your upgrade

1. Check that all resources are healthy:
    ```bash
    helm list -n crossplane-system
    kubectl get configurations.pkg
    kubectl get providers.pkg
    kubectl get functions.pkg
    kubectl get composite -A
    kubectl get managed
    ```

    `helm list` now shows the `-up.N` chart. Everything else reports the same
    healthy state it did before the upgrade.

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
<!-- vale Google.Headings = NO -->
## Create or choose a Hub
<!-- vale Google.Headings = YES -->

The Hub gives you one API and Console for every control plane you run,
including the one you just upgraded. If your organization already runs a Hub,
whether Upbound Cloud or self-hosted, skip to [Connect your control plane to
the Hub](#connect-your-control-plane-to-the-hub).

To stand up a new self-hosted Hub, follow the [Hub installation
guide][hub-install]. It walks through the Postgres, OIDC, and Gateway
prerequisites a production install needs. Upbound Cloud customers already
have a Hub, so sign in to the [Console][console] instead of installing one.

## Connect your control plane to the Hub

Register the control plane you just upgraded, then deploy `hub-connector` to
sync its resources into the Hub.

1. In the Console, open the **Control Planes** view, select **Register
   Control Plane**, and choose a realm and name for this control plane. The
   Console shows a registration token once, so copy it now.

2. Set the token and your control plane's kubeconfig context:

    ```shell
    export REGISTRATION_TOKEN=<paste-registration-token>
    export CONTROL_PLANE_CONTEXT=<control-plane-context>
    ```

3. Create a namespace and a secret holding the token:

    ```shell
    kubectl --context="$CONTROL_PLANE_CONTEXT" create namespace upbound-system

    kubectl --context="$CONTROL_PLANE_CONTEXT" --namespace upbound-system \
      create secret generic hub-connector-credentials \
      --from-literal=registrationToken="$REGISTRATION_TOKEN"
    ```

4. Install the connector, pointing it at your Hub:

    ```shell
    helm install hub-connector oci://xpkg.upbound.io/upbound/hub-connector \
      --kube-context "$CONTROL_PLANE_CONTEXT" \
      --namespace upbound-system \
      --set connector.hub.url=<hub-url>
    ```

5. Confirm the connector reaches `Ready`:

    ```shell
    kubectl --context="$CONTROL_PLANE_CONTEXT" --namespace upbound-system \
      wait --for=condition=Ready pod \
      --selector app.kubernetes.io/name=hub-connector --timeout=120s
    ```

    A connector stuck in `CrashLoopBackOff` with a `connection refused` error
    can't reach `connector.hub.url`. A rejected registration token means the
    Hub already consumed it, so reissue the token in the Console and replace
    the secret.

6. Open the Console's control planes view. This control plane shows a status
   of **Ready**, and its resources view lists what UXP now manages, including
   the packages and composite resources that came through the upgrade.

See [Connect a control plane][connect-hub] for the kubectl-only path,
troubleshooting steps, and how to scope which resources the connector syncs.

## Next steps

After upgrading to Upbound Crossplane, try out these features:

<!-- vale Google.We = NO -->
* The developer experience improvements with our [builders workshop][builders-workshop] 
* Browse all your managed resources with the [Crossplane Web UI][web-ui]
* Query resource states in real-time with [Upbound Query API][query-api]
* Leverage Intelligent Control Planes to [Dynamically scale an RDS Instance][rds]
* Join the [#Upbound channel on the Crossplane Slack][slack] for questions and support
* [Access management][access-management] to grant users and groups access to your control plane in the Hub
<!-- vale Google.We = YES -->


[xp-upgrade]: https://docs.crossplane.io/latest/guides/upgrade-to-crossplane-v2/
[uxp-release-notes]: /reference/release-notes/uxp
[upgrade-qs]: /manuals/uxp/upgrade-qs
[builders-workshop]: https://docs.upbound.io/getstarted/builders-workshop/project-foundations/
[web-ui]: https://docs.upbound.io/manuals/console/self-service/#key-features
[query-api]: https://docs.upbound.io/manuals/console/query-api/
[rds]: https://docs.upbound.io/guides/intelligent-control-planes/scale-database/
[slack]: https://crossplane.slack.com/archives/C01TRKD4623
[hub-install]: /hub/howtos/install
[connect-hub]: /hub/howtos/connect-control-plane
[access-management]: /hub/iam/access-management/overview
[console]: https://console.upbound.io

