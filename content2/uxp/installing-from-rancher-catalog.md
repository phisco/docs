---
title: "Installing from Rancher Catalog"
metaTitle: "Installing from Rancher Catalog"
metaDescription: "Installing from Rancher Catalog"
rank: 13
---

UXP is available to install into Kubernetes clusters managed by Rancher via the 
Rancher Catalog.

1. Navigate to `Apps & Marketplace` in the upper left corner of the Rancher UI
    ![apps and marketplaces](../images/uxp/apps-and-marketplace-navigation.png)
1. In the filter box, type "Upbound" and select the UXP listing which will 
apear in the results
1. You'll be taken to the installation page where you can configure UXP and 
install it into your cluster.
    ![Rancher catalog install page](../images/uxp/rancher-catalog-uxp-install-page.png)
1. Once configured (see more below) and installed, follow the instructions on
   the README to connect your UXP deployment to Upbound for easy management.


## Configuration Options

On the left hand-side, you'll notice several sections where you're able to 
configure the UXP deployment.

| Parameter | Description | Default |
| --- | --- | --- |
| `upbound.controlPlane.token`| The secret token generated from `up uxp attach`. | `""`
| `upbound.controlPlane.permission`| Grant Upbound Cloud edit or view access to your control plane | `edit`
| `replicas`| The number of replicas to run for the Crossplane pods | 1
| `leaderElection` | Enable leader election for Crossplane Managers pod | `true` |
| `deploymentStrategy` | The deployment strategy for the Crossplane and RBAC Manager (if enabled) pods | `RollingUpdate` |
| `priorityClassName` | Priority class name for Crossplane and RBAC Manager (if enabled) pods | `""` |
| `metrics.enabled` | Expose Crossplane and RBAC Manager metrics endpoint | `false` |
| `rbacManager.deploy` | Deploy RBAC Manager and its required roles | `true` |
| `rbacManager.replicas` | The number of replicas to run for the RBAC Manager pods | `1` |
| `rbacManager.leaderElection` | Enable leader election for RBAC Managers pod | `true` |
| `rbacManager.managementPolicy`| The extent to which the RBAC manager will manage permissions. `All` indicates to manage all Crossplane controller and user roles. `Basic` indicates to only manage Crossplane controller roles and the `crossplane-admin`, `crossplane-edit`, and `crossplane-view` user roles. | `All` |
| `rbacManager.skipAggregatedClusterRoles` | Opt out of deploying aggregated ClusterRoles | `false` |
| `provider.packages` | The list of Provider packages to install together with Crossplane | `[]` |
| `configuration.packages` | The list of Configuration packages to install together with Crossplane | `[]` |
| `packageCache.sizeLimit` | Size limit for package cache. If medium is `Memory` then maximum usage would be the minimum of this value the sum of all memory limits on containers in the Crossplane pod. | `5Mi` |
| `packageCache.medium` | Storage medium for package cache. `Memory` means volume will be backed by tmpfs, which can be useful for development. | `""` |
| `packageCache.pvc` | Name of the PersistentVolumeClaim to be used as the package cache. Providing a value will cause the default emptyDir volume to not be mounted. | `""` |
| `xgql.debugMode` | Puts XGQL into debug mode for enhanced logging | `False`
| `xgql.metrics.enabled` | Exposes an open telemetry metrics endpoint on port 8080 | `False`
| `agent.config.debugMode` | Puts the Upbound Agent into debug mode for enhanced logging | `False`
