---
title: "Universal Crossplane"
icon: "Popsicle"
metaTitle: "UXP"
metaDescription: "UXP - Upbound Universal Crossplane"
rank: 10
---

Upbound Universal Crossplane (UXP) is Upbound's official enterprise-grade
distribution of Crossplane. It's fully compatible with downstream Crossplane,
open source, capable of connecting to Upbound Cloud for real-time dashboard
visibility, and maintained by Upbound. It's the easiest way for both individual
community members and enterprises to start deploying control plane architectures
to production.

## Installing UXP

UXP is typically installed using [up], the official Upbound CLI. up will use the
current kubeconfig to determine the cluster to target and will install UXP into
the `upbound-system` namespace by default.

```console
up uxp install
```

> Installing UXP without a specified version will automatically install the
> latest stable version.

Default installation parameters can be modified by providing values via the
`--set` flag or a [Helm] style [values file].

```console
up uxp install --set key1=value1,key2=value2 -f my-values.yaml
```

> UXP can also be installed using Helm directly, but some functionality that up
> provides will not be supported.

### Upgrading from OSS Crossplane

UXP is a [conformant Crossplane distribution] and existing Crossplane
installations can be upgraded to UXP using up. When upgrading from Crossplane to
UXP, users must upgrade to a _compatible_ UXP version. UXP versions with the
same major, minor, and patch number are considered compatible (e.g. v1.2.1 of
Crossplane is compatible with UXP v1.2.1-up.N). In addition, because Crossplane
only supports Helm installation today, upgrading to UXP must take place in the
same namespace where Crossplane is installed (typically `crossplane-system`).

```console
up uxp upgrade vX.Y.Z-up.N -n crossplane-system
```

> For convenience, users can make all UXP commands use a specific namespace by
> setting the `UXP_NAMESPACE` environment variable.

As with a new UXP installation, parameters can be provided on upgrade using
`--set` or a values file.

```console
up uxp upgrade vX.Y.Z-up.N -n crossplane-system --set key1=value1,key2=value2 -f my-values.yaml
```

## Uninstall UXP

UXP can be uninstalled with a single command:

```console
up uxp uninstall
```

<!-- Named Links -->
[up]: ../cli
[Helm]: https://helm.sh/docs/chart_template_guide/values_files/
[values file]: https://github.com/upbound/universal-crossplane/blob/main/cluster/charts/universal-crossplane/values.yaml.tmpl
[conformant Crossplane distribution]: https://github.com/cncf/crossplane-conformance
