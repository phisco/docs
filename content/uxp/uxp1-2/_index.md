---
title: "Upbound Universal Crossplane (UXP) 1.2"
rank: 10
version: 1.2
product: UXP
geekdocCollapseSection: true
---

Upbound Universal Crossplane (UXP) is the Upbound official enterprise-grade
distribution of Crossplane for self-hosted control planes. 

Install UXP into an existing Kubernetes cluster to access Upbound features like [officialcommunity Crossplane features.

## Quickstart

```shell
$ curl -sL "https://cli.upbound.io" | sh
$ sudo mv up /usr/local/bin/
```
* Install UXP
```shell
$ up uxp install
```
* Verify UXP pods in the upbound-system namespace
```shell
$ kubectl get pods -n upbound-system
NAME                                      READY   STATUS    RESTARTS      AGE
crossplane-7c5c7d98b-qvl64                1/1     Running   0             50s
crossplane-rbac-manager-6596d6678-8bmkl   1/1     Running   0             50s
upbound-bootstrapper-744957b859-stw7t     1/1     Running   0             50s
xgql-8549b948c5-xprzb                     1/1     Running   2 (48s ago)   50s
```

## Install Upbound Universal Crossplane

Installing UXP requires the 

Use the `up uxp install` command to install UXP into the current Kubernetes cluster based on `~/.kube/config`.

```console
up uxp install
```

Up installs the latest stable [UXP release](https://github.com/upbound/universal-crossplane/releases/tag/v1.8.1-up.2) into the `upbound-system` namespace.

### Install a specific Upbound Universal Crossplane version
Install a specific version of UXP with `up uxp install <version>`. 

The list of available versions is in the [charts.upbound.io/stable](https://charts.upbound.io/stable/) listing.

{{< hint type="note" >}}
Don't include the `universal-crossplane-` name when using `up uxp install <version>`. 
For example, `up uxp install 1.8.1-up.1`
{{< /hint >}}

### Install Upbound Universal Crossplane in a custom namespace
Install UXP into a specific namespace using the `-n <NAMESPACE>` option.

For example, to install UXP into the upbound-test namespace use the command

```shell
up uxp install -n upbound-test
```

### Install unofficial Upbound Universal Crossplane versions

Install unofficial releases for testing or troubleshooting. Don't install unofficial versions for production use without explicit guidance from Upbound.

Find available unofficial releases in the [charts.upbound.io/main](https://charts.upbound.io/main/) listing. 

Install the latest unofficial release with the `--unstable` flag.

`up uxp install --unstable`

Install a specific release with `up uxp install --unstable <version>`

{{< hint type="note" >}}
Don't include the `universal-crossplane-` name when using `up uxp install --unstable <version>`. 
For example, `up uxp install --unstable 1.9.0-up.1.rc.1.6.g3b4985a`
{{< /hint >}}

### Customize install options 
Change default install settings via the command-line with `--set <key>=<value>` or a settings file with `-f <file>`.

{{< hint type="tip" >}}
A configuration file is the recommended method to customize the UXP install.
{{< /hint >}}

Provide file-based configurations as a [Helm values file](https://helm.sh/docs/chart_template_guide/values_files/). 

For example to configure two Crossplane pod replicas and increase the pod memory limit to 1 Gigabyte with `--set`:

`up uxp install --set image.pullPolicy=IfNotPresent,replicas=2`

To provide a `customAnnotation` of `a8r.io/owner: "@upbound"` with `-f`

```shell
$ cat settings.yaml
replicas: 2

image:
    pullPolicy: IfNotPresent

$ up uxp install -f settings.yaml
```

{{< expand "Optional install configurations">}}
| **Parameter**                                       | **Description**                                                                                                                                                                                                                                                                           | **Default**                                                                                                                                                                                                                                                                                                                                                        |
|-----------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| affinity                                            | Enable and define the affinity for the `crossplane` pod.                                                                                                                                                                                                                                  | `{}` - Affinities aren't configured.                                                                                                                                                                                                                                                                                                                               |
| configuration.packages                              | The list of `configuration packages` to install together with UXP. These packages install UXP resources after the `crossplane` pod starts.                                                                                                                                                | `{}` - Configurations aren't installed by default.                                                                                                                                                                                                                                                                                                                 |
| customAnnotations                                   | Custom annotations to add to the `crossplane` deployment and pod.                                                                                                                                                                                                                         | `{}` - Annotations aren't configured.                                                                                                                                                                                                                                                                                                                              |
| customLabels                                        | Custom labels to add to the `crossplane` and `crossplane-rbac-manager` deployments and pods. Overwriting default labels isn't supported and causes the install to fail.                                                                                                                   | ```{app=crossplane, app.kubernetes.io/component=cloud-infrastructure-controller, app.kubernetes.io/instance=universal-crossplane, app.kubernetes.io/managed-by=Helm, app.kubernetes.io/name=crossplane, app.kubernetes.io/part-of=crossplane, app.kubernetes.io/version=<crossplane version>, helm.sh/chart=<crossplane version>, release=universal-crossplane}``` |
| deploymentStrategy                                  | The deployment strategy for the `crossplane` and `crossplane-rbac-manager` pods.                                                                                                                                                                                                          | `RollingUpdate`                                                                                                                                                                                                                                                                                                                                                    |
| extraEnvVarsCrossplane                              | List of extra environment variables to set in the `crossplane` deployment. A \_ replaces any `.` character in a variable name. For example `SAMPLE.KEY=value1` becomes `SAMPLE\_KEY=value1`.                                                                                              | ```{POD_NAMESPACE:(v1:metadata.namespace),olala:olala,LEADER_ELECTION:true}```                                                                                                                                                                                                                                                                                     |
| extraEnvVarsRBACManager                             | List of extra environment variables to set in the `crossplane-rbac-manager` deployment. A \_ replaces any `.` character in a variable name. For example `SAMPLE.KEY=value1` becomes `SAMPLE\_KEY=value1`.                                                                                 | ```{LEADER_ELECTION:true}```                                                                                                                                                                                                                                                                                                                                       |
| image.pullPolicy                                    | Kubernetes [image pull policy](https://kubernetes.io/docs/concepts/containers/images/#image-pull-policy).                                                                                                                                                                                 | `IfNotPresent`                                                                                                                                                                                                                                                                                                                                                     |
| image.repository                                    | Container image repository to download UXP from.                                                                                                                                                                                                                                          | The DockerHub repository `upbound/crossplane`.                                                                                                                                                                                                                                                                                                                     |
| image.tag                                           | Image tag to install a specific Crossplane version. Provides the same function as `up uxp install <image.tag>`.                                                                                                                                                                           | `""` - Without an image tag Up installs the `latest` UXP version.                                                                                                                                                                                                                                                                                                  |
| imagePullSecrets                                    | List of Kubernetes [image pull secrets](https://kubernetes.io/docs/concepts/containers/images/#specifying-imagepullsecrets-on-a-pod). Required if `image.repository` uses authentication.                                                                                                 | `""` - Secrets aren't configured.                                                                                                                                                                                                                                                                                                                                  |
| leaderElection                                      | Enable leader election for the `crossplane` deployment and pods. Set `leaderElection` as `true` for any deployment with more than 1 `replica` to prevent race-conditions.                                                                                                                 | `true`                                                                                                                                                                                                                                                                                                                                                             |
| metrics.enabled                                     | Exposes port `8080` in the `crossplane` and `crossplane-rbac-manager` pods. Configures pod annotations `prometheus.io/path:/metrics`, `prometheus.io/port:"8080"` and `prometheus.io/scrape:"true"`.                                                                                      | `false`                                                                                                                                                                                                                                                                                                                                                            |
| nodeSelector                                        | Apply a `nodeSelector` map to the `crossplane` pod.                                                                                                                                                                                                                                       | `{}` - Node selectors aren't configured.                                                                                                                                                                                                                                                                                                                           |
| packageCache.medium                                 | The Kubernetes [`emptyDir` Volume type](https://kubernetes.io/docs/concepts/storage/volumes/#volume-types) for the `crossplane` pod's package cache. The only valid value is `"memory"`. Not supported with `packageCache.pvc`.                                                           | `""` - Kubernetes pod default of local node storage.                                                                                                                                                                                                                                                                                                               |
| packageCache.pvc                                    | A [`PersistentVolumeClaim`](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) for the `crossplane` pod's package cache. `packageCache.pvc` is an alternative to the default `emptyDir` volume mount. Not supported with `packageCache.medium` or `packageCache.sizeLimit`. | `""` - `emptyDir` is the default mounted pod volume.                                                                                                                                                                                                                                                                                                               |
| packageCache.sizeLimit                              | The size limit for the `crossplane` pod's `emptyDir` package cache. Not supported with `pacakgeCache.pvc`.                                                                                                                                                                                | `5Mi`                                                                                                                                                                                                                                                                                                                                                              |
| priorityClassName                                   | Applies a priority class name to the `crossplane` and `crossplane-rbac-manager` deployments and pods.                                                                                                                                                                                     | `""` - A priority class isn't set.                                                                                                                                                                                                                                                                                                                                 |
| provider.packages                                   | The list of `provider packages` to install together with UXP. These packages install UXP resources after the `crossplane` pod starts.                                                                                                                                                     | `[]` - Providers aren't installed by default.                                                                                                                                                                                                                                                                                                                      |
| rbacManager.affinity                                | Enable and define the affinity for the `crossplane` pod.                                                                                                                                                                                                                                  | `{}` - Affinities aren't configured.                                                                                                                                                                                                                                                                                                                               |
| rbacManager.deploy                                  | Deploy RBAC Manager and its required roles.                                                                                                                                                                                                                                               | `true`                                                                                                                                                                                                                                                                                                                                                             |
| rbacManager.leaderElection                          | Enable leader election for the `crossplane-rbac-manager` deployment and pods. Set `leaderElection` as `true` for any deployment with more than 1 `replica` to prevent race-conditions.                                                                                                    | `true`                                                                                                                                                                                                                                                                                                                                                             |
| rbacManager.managementPolicy                        | The scope of `crossplane-rbac-manager` permissions control. A value of `all` all Crossplane controller and user roles. `basic` only manages Crossplane controller roles and the `crossplane-admin`, `crossplane-edit`, and `crossplane-view` user roles.                                  | `all`                                                                                                                                                                                                                                                                                                                                                              |
| rbacManager.nodeSelector                            | Apply a `nodeSelector` map to the `crossplane` pod.                                                                                                                                                                                                                                       | `{}` - Node selectors aren't configured.                                                                                                                                                                                                                                                                                                                           |
| rbacManager.replicas                                | The number of `crossplane-rbac-manager` replicas.                                                                                                                                                                                                                                         | `1`                                                                                                                                                                                                                                                                                                                                                                |
| rbacManager.skipAggregatedClusterRoles              | Skip the deployment of `ClusterRoles` along with the `crossplane-rbac-manager`. Set to `true` to manually build Crossplane ClusterRoles.                                                                                                                                                  | `false`                                                                                                                                                                                                                                                                                                                                                            |
| rbacManager.tolerations                             | Enable `tolerations` for the `crossplane-rbac-manager` pod.                                                                                                                                                                                                                               | `{}` - Tolerations aren't configured.                                                                                                                                                                                                                                                                                                                              |
| registryCaBundleConfig.key                          | Use a custom CA certification for downloading images and configurations. The value of the `configMap` key. Use with `registryCaBundleConfig.name`                                                                                                                                         | `{}` - Crossplane uses the default system certificates.                                                                                                                                                                                                                                                                                                            |
| registryCaBundleConfig.name                         | Use a custom CA certification for downloading images and configurations. The value of the `configMap` name. Use with `registryCaBundleConfig.key`                                                                                                                                         | `{}` - Crossplane uses the default system certificates.                                                                                                                                                                                                                                                                                                            |
| replicas                                            | The number of `crossplane-rbac-manager` replicas.                                                                                                                                                                                                                                         | `1`                                                                                                                                                                                                                                                                                                                                                                |
| resourcesCrossplane.limits.cpu                      | CPU resource limits for the `crossplane` pods.                                                                                                                                                                                                                                            | `100m`                                                                                                                                                                                                                                                                                                                                                             |
| resourcesCrossplane.limits.memory                   | Memory resource limits for the `crossplane` pods.                                                                                                                                                                                                                                         | `512Mi`                                                                                                                                                                                                                                                                                                                                                            |
| resourcesCrossplane.requests.cpu                    | CPU resource requests for the `crossplane` pods.                                                                                                                                                                                                                                          | `100m`                                                                                                                                                                                                                                                                                                                                                             |
| resourcesCrossplane.requests.memory                 | Memory resource requests for the `crossplane` pods.                                                                                                                                                                                                                                       | `256Mi`                                                                                                                                                                                                                                                                                                                                                            |
| resourcesRBACManager.limits.cpu                     | CPU resource limits for the `crossplane-rbac-manager` pods.                                                                                                                                                                                                                               | `100m`                                                                                                                                                                                                                                                                                                                                                             |
| resourcesRBACManager.limits.memory                  | Memory resource limits for the `crossplane-rbac-manager` pods.                                                                                                                                                                                                                            | `512Mi`                                                                                                                                                                                                                                                                                                                                                            |
| resourcesRBACManager.requests.cpu                   | CPU resource requests for the `crossplane-rbac-manager` pods.                                                                                                                                                                                                                             | `100m`                                                                                                                                                                                                                                                                                                                                                             |
| resourcesRBACManager.requests.memory                | Memory resource requests for the `crossplane-rbac-manager` pods.                                                                                                                                                                                                                          | `256Mi`                                                                                                                                                                                                                                                                                                                                                            |
| securityContextCrossplane.allowPrivilegeEscalation  | Allow [privilege escalation](https://kubernetes.io/docs/concepts/security/pod-security-policy/#privilege-escalation) the `crossplane` pods.                                                                                                                                               | `false`                                                                                                                                                                                                                                                                                                                                                            |
| securityContextCrossplane.readOnlyRootFilesystem    | Set a [ReadOnly](https://kubernetes.io/docs/concepts/security/pod-security-policy/#volumes-and-file-systems) root file system for the `crossplane` pods.                                                                                                                                  | `true`                                                                                                                                                                                                                                                                                                                                                             |
| securityContextCrossplane.runAsGroup                | Set the [Run as group](https://kubernetes.io/docs/concepts/security/pod-security-policy/#users-and-groups) for the `crossplane` pods.                                                                                                                                                     | `65532`                                                                                                                                                                                                                                                                                                                                                            |
| securityContextCrossplane.runAsUser                 | Set the [Run as user](https://kubernetes.io/docs/concepts/security/pod-security-policy/#users-and-groups) the `crossplane` pods.                                                                                                                                                          | `65532`                                                                                                                                                                                                                                                                                                                                                            |
| securityContextRBACManager.allowPrivilegeEscalation | Allow [privilege escalation](https://kubernetes.io/docs/concepts/security/pod-security-policy/#privilege-escalation) the `crossplane-rbac-manager` pods.                                                                                                                                  | `false`                                                                                                                                                                                                                                                                                                                                                            |
| securityContextRBACManager.readOnlyRootFilesystem   | Set a [ReadOnly](https://kubernetes.io/docs/concepts/security/pod-security-policy/#volumes-and-file-systems) root file system for the `crossplane-rbac-manager` pods.                                                                                                                     | `true`                                                                                                                                                                                                                                                                                                                                                             |
| securityContextRBACManager.runAsGroup               | Set the [Run as group](https://kubernetes.io/docs/concepts/security/pod-security-policy/#users-and-groups) for the `crossplane-rbac-manager` pods.                                                                                                                                        | `65532`                                                                                                                                                                                                                                                                                                                                                            |
| securityContextRBACManager.runAsUser                | Set the [Run as user](https://kubernetes.io/docs/concepts/security/pod-security-policy/#users-and-groups) the `crossplane-rbac-manager` pods.                                                                                                                                             | `65532`                                                                                                                                                                                                                                                                                                                                                            |
| serviceAccount.customAnnotations                    | Custom annotations for the `crossplane` `serviceaccount`                                                                                                                                                                                                                                  | `{meta.helm.sh/release-name: universal-crossplane, meta.helm.sh/release-namespace: upbound-system}`                                                                                                                                                                                                                                                                |
| tolerations                                         | Enable `tolerations` for the `crossplane` pod.                                                                                                                                                                                                                                            | `{}` - Tolerations aren't configured.                                                                                                                                                                                                                                                                                                                              |
| webhooks.enabled                                    | Create a service and expose TCP port 9443 to support `webhooks` for all Crossplane created pods.                                                                                                                                                                                          | `false`                                                                                                                                                                                                                                                                                                                                                            |
{{< /expand >}}

## Upgrade Upbound Universal Crossplane

### Upgrade from Upbound Universal Crossplane
UXP supports upgrading from any older UXP release to any newer UXP release version.

Use `up uxp upgrade <VERSION>` to upgrade UXP.

For example, to upgrade to version `v1.7.0-up.1` use the command 
```console
up uxp upgrade v1.7.0-up.1 -n upbound-system
```

{{< hint type="note" >}}
You must provide the current UXP namespace.
{{< /hint >}}

### Upgrade from open source Crossplane
UXP supports upgrading from open source Crossplane to UXP with identical version numbers.  

Identical versions have the same major, minor, and patch numbers.  
For example, Crossplane `v1.3.1` and UXP `v1.3.1-up.1` are identical.  
  
Crossplane `v1.3.1` and UXP `v1.3.3-up.1` aren't.

Use `up uxp upgrade <VERSION>` to upgrade from Crossplane to UXP.
```console
up uxp upgrade v1.7.0-up.1 -n crossplane-system
```
{{< hint type="note" >}}
You must install UXP in the same namespace as the existing Crossplane install.
{{< /hint >}}

To upgrade Crossplane to UXP find the current version of Crossplane installed.
```console
$ kubectl get pods  -n crossplane-system -o jsonpath='{.items[*].spec.containers[*].image}{"\n"}'
crossplane/crossplane:v1.7.0 crossplane/crossplane:v1.7.0
```

View the current Crossplane related pods.
```console
$ kubectl get pods -n crossplane-system
NAME                                       READY   STATUS    RESTARTS   AGE
crossplane-7db56bd5c6-85z8s                1/1     Running   0          25m
crossplane-rbac-manager-78469fcfcf-6df5g   1/1     Running   0          25m
```

Find the correct version of UXP to upgrade to from the [UXP releases page](https://github.com/upbound/universal-crossplane/releases).

Upgrade to the compatible version of UXP.
```console
up uxp upgrade v1.7.0-up.1 -n crossplane-system
```

Upgrading to UXP replaces the `crossplane` and `crossplane-rbac-manager` pods and adds two new pods to the cluster.

```console
$ kubectl get pods -n crossplane-system
NAME                                       READY   STATUS    RESTARTS     AGE
crossplane-797c7cd8b6-csp8h                1/1     Running   0            2m7s
crossplane-rbac-manager-744b86cbcd-c45tk   1/1     Running   0            2m7s
upbound-bootstrapper-5bbdbf758b-s4zrl      1/1     Running   0            2m7s
xgql-666f97f4cf-x2lpv                      1/1     Running   1 (2m ago)   2m7s
```

## Uninstall Upbound Universal Crossplane

Uninstall UXP with `up uxp uninstall`.

```console
up uxp uninstall
```

{{< hint type="important" >}}
The `uninstall` command assumes UXP is in the `upbound-system` namespace. 
{{< /hint >}}

Uninstall UXP from a specific namespace with `up uxp uninstall -n <NAMESPACE>`

```console
$ up uxp uninstall
up: error: uninstall: Release not loaded: universal-crossplane: release: not found

$ up uxp uninstall -n upbound-test
```

{{< hint type="warning" >}}
A UXP install upgraded from Crossplane doesn't support `up uxp uninstall`.
*<!-- TOTO: Tracked by issue https://github.com/upbound/up/issues/187 -->* 
{{< /hint >}}

*<!-- TOTO: Provide manual uninstall steps based on Crossplane docs https://crossplane.io/docs/v1.8/reference/uninstall.html -->* 