---
title: Uninstall UXP
weight: 230
---

Uninstall UXP with `up uxp uninstall`.

{{< hint type="warning" >}}
A UXP install upgraded from Crossplane doesn't support `up uxp uninstall`.
*<!-- TOTO: Tracked by issue https://github.com/upbound/up/issues/187 -->* 
{{< /hint >}}

```shell
up uxp uninstall
```

{{< hint type="important" >}}
The `uninstall` command assumes UXP is in the `upbound-system` namespace. 
{{< /hint >}}

Uninstall UXP from a specific namespace with `up uxp uninstall -n <NAMESPACE>`

```shell
up uxp uninstall
up: error: uninstall: Release not loaded: universal-crossplane: release: not found

$ up uxp uninstall -n upbound-test
```

*<!-- TOTO: Provide manual uninstall steps based on Crossplane docs https://crossplane.io/docs/v1.8/reference/uninstall.html -->* 
