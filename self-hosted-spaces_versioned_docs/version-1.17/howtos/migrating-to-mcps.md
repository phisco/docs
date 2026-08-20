---
title: Migrating to Upbound control planes
sidebar_position: 90
description: A guide to how to migrate to a control plane in Upbound
---

The Upbound migration tool is a [CLI command][cli-command] that helps you migrate your existing Crossplane control plane to a control plane in Upbound. This tool works for migrating from self-managed Crossplane installations as well as between Upbound managed control planes (MCPs).


To migrate a control plane to Upbound, you must:

1. Export your existing Crossplane control plane configuration/state into an archive file.
2. Import the archive file into a control plane running in Upbound.
The migration tool is available in the [up CLI][up-cli] as
`up controlplane migration export` and `up controlplane migration import` commands.

## Prerequisites

Before you begin, you must have the following:
- The [up CLI][up-cli-1] version 0.23.0 or later.

## Migration process

To migrate an existing Crossplane control plane to a control plane in Upbound, do the following:

1. Run the `up controlplane migration export` command to export your existing Crossplane control plane configuration/state into an archive file:

    ```bash
    up controlplane migration export --kubeconfig <path-to-source-kubeconfig> --output <path-to-archive-file>
    ```

    The command exports your existing Crossplane control plane configuration/state into an archive file.

::: note
By default, the export command doesn't make any changes to your existing Crossplane control plane state, leaving it intact. Use the `--pause-before-export` flag to pause the reconciliation on managed resources before exporting the archive file.

This safety mechanism ensures the control plane you migrate state to doesn't assume ownership of resources before you're ready.
:::

2. Use the control plane [create command][create-command] to create a managed
control plane in Upbound:

    ```bash
    up controlplane create my-controlplane
    ```

3. Use [`up ctx`][up-ctx] to connect to the control plane created in the previous step:

    ```bash
    up ctx "<your-org>/<your-space>/<your-group>/my-controlplane"
    ```

    The command configures your local `kubeconfig` to connect to the control plane.

4. Run the following command to import the archive file into the control plane:

    ```bash
    up controlplane migration import --input <path-to-archive-file>
    ```
<!-- vale write-good.Weasel = NO -->
:::note
By default, the import command leaves the control plane in an inactive state by pausing the reconciliation on managed
resources. This pause gives you an opportunity to review the imported configuration/state before activating the control plane.
Use the `--unpause-after-import` flag to change the default behavior and activate the control plane immediately after
importing the archive file.
:::
<!-- vale write-good.Weasel = YES -->


5. Review and validate the imported configuration/state. When you are ready, activate your managed
   control plane by running the following command:

    ```bash
    kubectl annotate managed --all crossplane.io/paused-
    ```

   At this point, you can delete the source Crossplane control plane.

## CLI options

### Filtering

The migration tool captures the state of a Control Plane. The only filtering
supported is Kubernetes namespace and Kubernetes resource Type filtering.

You can exclude namespaces using the `--exclude-namespaces` CLI option. This can prevent the CLI from including unwanted resources in the export.

```bash
--exclude-namespaces=kube-system,kube-public,kube-node-lease,local-path-storage,...

# A list of specific namespaces to exclude from the export. Defaults to 'kube-system', 'kube-public','kube-node-lease', and 'local-path-storage'.
```

You can exclude Kubernetes Resource types by using the `--exclude-resources` CLI option:

```bash
--exclude-resources=EXCLUDE-RESOURCES,... 

# A list of resource types to exclude from the export in "resource.group" format. No resources are excluded by default.
```

For example, here's an example for excluding the CRDs installed by Crossplane functions (since they're not needed):

```bash
up controlplane migration export \
  --exclude-resources=gotemplates.gotemplating.fn.crossplane.io,kclinputs.template.fn.crossplane.io
```

:::warning
You must specify resource names in lowercase "resource.group" format (for example, `gotemplates.gotemplating.fn.crossplane.io`). Using only the resource kind (for example, `GoTemplate`) isn't supported.
:::

<!-- vale write-good.Passive = NO -->
:::tip Function Input CRDs

Exclude function input CRDs (`inputs.template.fn.crossplane.io`, `resources.pt.fn.crossplane.io`, `gotemplates.gotemplating.fn.crossplane.io`, `kclinputs.template.fn.crossplane.io`) from migration exports. Upbound automatically recreates these resources during import. Function input CRDs typically have owner references to function packages and may have restricted RBAC access. Upbound installs these CRDs during the import when function packages are restored.

:::
<!-- vale write-good.Passive = YES -->

After export, users can also change the archive file to only include necessary resources.

### Export non-Crossplane resources

Use the `--include-extra-resources=` CLI option to select other CRD types to include in the export.

### Set the kubecontext

Currently `--context` isn't supported in the migration CLI. You should be able to use the `--kubeconfig` CLI option to use a file that's set to the correct context. For example:

```bash
up controlplane migration export --kubeconfig
```

Use this in tandem with `up ctx` to export a control plane's kubeconfig:

```bash
up ctx --kubeconfig ~/.kube/config

# To list the current contet
up ctx . --kubeconfig ~/.kube/config
```

## Export archive

The migration CLI exports an archive upon successful completion. Below is an example export of a control plane that excludes several CRD types and skips the confirmation prompt. A file gets written to the working directory, unless you select another output file:

<details>

<summary>View the example export</summary>

```bash
$ up controlplane migration export --exclude-resources=gotemplates.gotemplating.fn.crossplane.io,kclinputs.template.fn.crossplane.io --yes
Exporting control plane state...
✓ Scanning control plane for types to export... 121 types found! 👀
✓ Exporting 121 Crossplane resources...60 resources exported! 📤
✓ Exporting 3 native resources...8 resources exported! 📤
✓ Archiving exported state... archived to "xp-state.tar.gz"! 📦
```

</details>


When an export occurs, a file named `xp-state.tar.gz` by default gets created in the working directory. You can unzip the file and all the contents of the export are all text YAML files.

- Each CRD (for example `vpcs.ec2.aws.upbound.io`) gets its own directory
which contains:
  - A `metadata.yaml` file that contains Kubernetes Object Metadata
  - A list of Kubernetes Categories the resource belongs to
- A `cluster` directory that contains YAML manifests for all resources provisioned
using the CRD.

Sample contents for a Cluster with a single `XNetwork` Composite from
[configuration-aws-network][configuration-aws-network] is show below:


<details>

<summary>View the example cluster content</summary>

```bash
├── compositionrevisions.apiextensions.crossplane.io
│ ├── cluster
│ │ ├── kcl.xnetworks.aws.platform.upbound.io-4ca6a8a.yaml
│ │ └── xnetworks.aws.platform.upbound.io-9859a34.yaml
│ └── metadata.yaml
├── configurations.pkg.crossplane.io
│ ├── cluster
│ │ └── configuration-aws-network.yaml
│ └── metadata.yaml
├── deploymentruntimeconfigs.pkg.crossplane.io
│ ├── cluster
│ │ └── default.yaml
│ └── metadata.yaml
├── export.yaml
├── functions.pkg.crossplane.io
│ ├── cluster
│ │ ├── crossplane-contrib-function-auto-ready.yaml
│ │ ├── crossplane-contrib-function-go-templating.yaml
│ │ └── crossplane-contrib-function-kcl.yaml
│ └── metadata.yaml
├── internetgateways.ec2.aws.upbound.io
│ ├── cluster
│ │ └── borrelli-backup-test-xgl4q.yaml
│ └── metadata.yaml
├── mainroutetableassociations.ec2.aws.upbound.io
│ ├── cluster
│ │ └── borrelli-backup-test-t2qh7.yaml
│ └── metadata.yaml
├── namespaces
│ └── cluster
│ ├── crossplane-system.yaml
│ ├── default.yaml
│ └── upbound-system.yaml
├── providerconfigs.aws.upbound.io
│ ├── cluster
│ │ └── default.yaml
│ └── metadata.yaml
├── providerconfigusages.aws.upbound.io
│ ├── cluster
│ │ ├── 0a2a3ec6-ef13-45f9-9cf0-63af7f4a6b6b.yaml
...redacted
│ │ └── f7092b0f-3a78-4bfe-82c8-57e5085a9b11.yaml
│ └── metadata.yaml
├── providers.pkg.crossplane.io
│ ├── cluster
│ │ ├── upbound-provider-aws-ec2.yaml
│ │ └── upbound-provider-family-aws.yaml
│ └── metadata.yaml
├── routes.ec2.aws.upbound.io
│ ├── cluster
│ │ └── borrelli-backup-test-dt9cj.yaml
│ └── metadata.yaml
├── routetableassociations.ec2.aws.upbound.io
│ ├── cluster
│ │ ├── borrelli-backup-test-mr2sd.yaml
│ │ ├── borrelli-backup-test-ngq5h.yaml
│ │ ├── borrelli-backup-test-nrkgg.yaml
│ │ └── borrelli-backup-test-wq752.yaml
│ └── metadata.yaml
├── routetables.ec2.aws.upbound.io
│ ├── cluster
│ │ └── borrelli-backup-test-dv4mb.yaml
│ └── metadata.yaml
├── secrets
│ └── namespaces
│ ├── crossplane-system
│ │ ├── cert-token-signing-gateway-pub.yaml
│ │ ├── mxp-hostcluster-certs.yaml
│ │ ├── package-pull-secret.yaml
│ │ └── xgql-tls.yaml
│ └── upbound-system
│ └── aws-creds.yaml
├── securitygrouprules.ec2.aws.upbound.io
│ ├── cluster
│ │ ├── borrelli-backup-test-472f4.yaml
│ │ └── borrelli-backup-test-qftmw.yaml
│ └── metadata.yaml
├── securitygroups.ec2.aws.upbound.io
│ ├── cluster
│ │ └── borrelli-backup-test-w5jch.yaml
│ └── metadata.yaml
├── storeconfigs.secrets.crossplane.io
│ ├── cluster
│ │ └── default.yaml
│ └── metadata.yaml
├── subnets.ec2.aws.upbound.io
│ ├── cluster
│ │ ├── borrelli-backup-test-8btj6.yaml
│ │ ├── borrelli-backup-test-gbmrm.yaml
│ │ ├── borrelli-backup-test-m7kh7.yaml
│ │ └── borrelli-backup-test-nttt5.yaml
│ └── metadata.yaml
├── vpcs.ec2.aws.upbound.io
│ ├── cluster
│ │ └── borrelli-backup-test-7hwgh.yaml
│ └── metadata.yaml
└── xnetworks.aws.platform.upbound.io
├── cluster
│ └── borrelli-backup-test.yaml
└── metadata.yaml
43 directories, 87 files
```

</details>


The `export.yaml` file contains metadata about the export, including the configuration of the export, Crossplane information, and what's included in the export bundle.

<details>

<summary>View the export</summary>

```yaml
version: v1alpha1
exportedAt: 2025-01-06T17:39:53.173222Z
options:
  excludedNamespaces:
    - kube-system
    - kube-public
    - kube-node-lease
    - local-path-storage
  includedResources:
    - namespaces
    - configmaps
    - secrets
  excludedResources:
    - gotemplates.gotemplating.fn.crossplane.io
    - kclinputs.template.fn.crossplane.io
crossplane:
  distribution: universal-crossplane
  namespace: crossplane-system
  version: 1.17.3-up.1
  featureFlags:
    - --enable-provider-identity
    - --enable-environment-configs
    - --enable-composition-functions
    - --enable-usages
stats:
  total: 68
  nativeResources:
    configmaps: 0
    namespaces: 3
    secrets: 5
  customResources:
    amicopies.ec2.aws.upbound.io: 0
    amilaunchpermissions.ec2.aws.upbound.io: 0
    amis.ec2.aws.upbound.io: 0
    availabilityzonegroups.ec2.aws.upbound.io: 0
    capacityreservations.ec2.aws.upbound.io: 0
    carriergateways.ec2.aws.upbound.io: 0
    compositeresourcedefinitions.apiextensions.crossplane.io: 0
    compositionrevisions.apiextensions.crossplane.io: 2
    compositions.apiextensions.crossplane.io: 0
    configurationrevisions.pkg.crossplane.io: 0
    configurations.pkg.crossplane.io: 1
...redacted
```

</details>

### Skipped resources

Along with to the resources excluded via CLI options, the following resources aren't
included in the backup:

- The `kube-root-ca.crt` ConfigMap, since this is cluster-specific
- Resources directly managed via Helm (ArgoCD's helm implementation, which templates
Helm resources and then applies them, get included in the backup). The migration creates the exclusion list by looking for:
  - Any Resource with the label `"app.kubernetes.io/managed-by" == "Helm"`
  - Kubernetes Secrets with the label prefix `helm.sh/release`. For example, `helm.sh/release.v1`
- Resources installed via a Crossplane package. These have an `ownerReference` with
a prefix `pkg.crossplane.io`. The expectation is that during import, the Crossplane Package Manager bears responsibility for installing the resources.
- Crossplane Locks: Any `Lock.pkg.crossplane.io` resource isn't included in the
export.

## Restore

The following is an example of a successful import run. At the end of the import, all Managed Resources are in a paused state.

<details>

<summary>View the migration import</summary>

```bash
$ up controlplane migration import
Importing control plane state...
✓ Reading state from the archive... Done! 👀
✓ Importing base resources... 18 resources imported! 📥
✓ Waiting for XRDs... Established! ⏳
✓ Waiting for Packages... Installed and Healthy! ⏳
✓ Importing remaining resources... 50 resources imported! 📥
✓ Finalizing import... Done! 🎉
```

</details>

Your scenario may involve migrating resources which already exist through other automation on the platform. When executing an import in these circumstances, the importer applies the new manifests to the cluster. If the resource already exists, the restore sets fields to what's in the backup. 

The importer restores all resources in the export archive. Managed Resources get imported with the `crossplane.io/paused: "true"` annotation set. Use the `--unpause-after-import` CLI argument to automatically un-pause resources that got
paused during backup, or remove the annotation manually.

### Restore order

The importer restores based on Kubernetes types. The restore order doesn't include parent/child relationships. 

Because Crossplane Composites create new Managed Resources if not present on the cluster, all
Claims, Composites and Managed Resources get imported in a paused state. You can un-pause them after the restore completes.

The first step of import is installing Base Resources into the cluster. These resources (such has
packages and XRDs) must be ready before proceeding with the import.
Base Resources are:

- Kubernetes Resources
  - ConfigMaps
  - Namespaces
  - Secrets
- Crossplane Resources
  - ControllerConfigs: `controllerconfigs.pkg.crossplane.io`
  - DeploymentRuntimeConfigs: `deploymentruntimeconfigs.pkg.crossplane.io`
  - StoreConfigs: `storeconfigs.secrets.crossplane.io`
- Crossplane Packages
  - Providers: `providers.pkg.crossplane.io`
  - Functions: `functions.pkg.crossplane.io`
  - Configurations: `configurations.pkg.crossplane.io`

Restore waits for the base resources to be `Ready` before moving on to the next step. Next, restore walks through the archive and restores all the manifests present.

During import, the `crossplane.io/paused` annotation gets added to Managed Resources, Claims
and Composites. 

To manually un-pause managed resources after an import, remove the annotation by running:

```bash
kubectl annotate managed --all crossplane.io/paused-
```

You can also run import again with the `--unpause-after-import` flag to remove the annotations.

```bash
up controlplane migration import --unpause-after-import
```

### Restoring resource status

The importer applies the status of all resources during import. The importer determines if the CRD version has a status field defined based on the stored CRD version.


[cli-command]: /reference/cli-reference
[up-cli]: /reference/cli-reference
[up-cli-1]: /manuals/cli/overview
[create-command]: /reference/cli-reference
[up-ctx]: /reference/cli-reference
[configuration-aws-network]: https://marketplace.upbound.io/configurations/upbound/configuration-aws-network
