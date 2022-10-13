---
title: "Upgrade UXP"
weight: 210
---

Use the `up` command-line Upbound Universal Crossplane (UXP) to upgrade an existing install to a newer version or to upgrade from open source Crossplane.

### Upgrade from Upbound Universal Crossplane
UXP supports upgrading from any older UXP release to any newer UXP release version.

Use `up uxp upgrade <VERSION>` to upgrade UXP.

For example, to upgrade to version `v1.7.0-up.1` use the command 
```shell
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

```shell
up uxp upgrade v1.7.0-up.1 -n crossplane-system
```
{{< hint type="note" >}}
You must install UXP in the same namespace as the existing Crossplane install.
{{< /hint >}}

To upgrade Crossplane to UXP find the current version of Crossplane installed.

```shell
kubectl get pods  -n crossplane-system -o jsonpath='{.items[*].spec.containers[*].image}{"\n"}'
crossplane/crossplane:v1.7.0 crossplane/crossplane:v1.7.0
```

View the current Crossplane related pods.
```shell
kubectl get pods -n crossplane-system
NAME                                       READY   STATUS    RESTARTS   AGE
crossplane-7db56bd5c6-85z8s                1/1     Running   0          25m
crossplane-rbac-manager-78469fcfcf-6df5g   1/1     Running   0          25m
```

Find the correct version of UXP to upgrade to from the [UXP releases page](https://github.com/upbound/universal-crossplane/releases).

Upgrade to the compatible version of UXP.
```shell
up uxp upgrade v1.7.0-up.1 -n crossplane-system
```

Upgrading to UXP replaces the `crossplane` and `crossplane-rbac-manager` pods and adds two new pods to the cluster.

```shell
kubectl get pods -n crossplane-system
NAME                                       READY   STATUS    RESTARTS     AGE
crossplane-797c7cd8b6-csp8h                1/1     Running   0            2m7s
crossplane-rbac-manager-744b86cbcd-c45tk   1/1     Running   0            2m7s
upbound-bootstrapper-5bbdbf758b-s4zrl      1/1     Running   0            2m7s
xgql-666f97f4cf-x2lpv                      1/1     Running   1 (2m ago)   2m7s
```