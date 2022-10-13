---
title: "Upbound Universal Crossplane (UXP)"
weight: 300
---

Upbound Universal Crossplane (`UXP`) is the Upbound commercially supported version of Crossplane. UXP consists of upstream Crossplane and Upbound-specific enhancements and patches.

## About Universal Crossplane
UXP is [open source](https://github.com/upbound/universal-crossplane) and [Crossplane conformant](https://github.com/cncf/crossplane-conformance).

UXP installs into an existing Kubernetes cluster. UXP extends the Kubernetes API using [Custom Resource Definitions](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) to support Crossplane resource types. 

## Universal Crossplane pods
UXP installs four pods into the Kubernetes cluster, inside the `upbound-system` namespace.

```shell {label="uxp-pods"}
kubectl get pods -n upbound-system
NAME                                      READY   STATUS    RESTARTS      AGE
crossplane-58b797d5c-fcsgc                1/1     Running   0             16h
crossplane-rbac-manager-59f79b9cd-fh4qx   1/1     Running   0             16h
upbound-bootstrapper-7f4cc75d99-z7znr     1/1     Running   0             16h
xgql-7c4b74c458-s26tv                     1/1     Running   2 (16h ago)   16h
```

* {{< hover label="uxp-pods" line="3" >}}crossplane{{< /hover >}} - The {{< hover label="uxp-pods" line="3" >}}crossplane{{</hover>}} pod is the core controller that extends Kubernetes and installs Crossplane extensions like `Providers`.
* {{< hover label="uxp-pods" line="4" >}}crossplane-rbac-manager{{< /hover >}} - The {{< hover label="uxp-pods" line="4" >}}crossplane-rbac-manager{{< /hover >}} pod allows Crossplane to create and dynamically adjust [Kubernetes Role-based access control (RBAC)](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) for Crossplane resources in the Kubernetes cluster. 
* {{< hover label="uxp-pods" line="5" >}}upbound-bootstrapper{{< /hover >}} - Creates and populates TLS certificates for use with the Upbound Cloud Console, `xgql` and kube-apiserver. 
* {{< hover label="uxp-pods" line="6" >}}xgql{{< /hover >}} - An [open source](https://github.com/upbound/xgql/) GraphQL implementation from Upbound used to improve performance between the Upbound Cloud Console and kube-apiserver.

{{<hint type="info" >}}
The [Up command-line]({{<ref "cli" >}}) installs Universal Crossplane using a Helm chart. Download the chart from [charts.upbound.io](https://charts.upbound.io/main/) to see the full details of the Universal Crossplane install.
{{< /hint >}}
