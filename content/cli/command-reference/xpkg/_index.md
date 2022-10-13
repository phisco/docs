---
title: "up xpkg"
geekdocCollapseSection: true
geekdocFileTreeSortBy: title
---
`xpkg` commands create and interact with Crossplane _Packages_. Packages are a set of YAML configuration files packaged as a single Open Container Initiative container image. 

Read the [Crossplane Packages]({{<ref "uxp/crossplane-concepts/packages">}}) section for background on packages.

Read the [Creating and Pushing Packages]({{<ref "upbound-marketplace/packages">}}) section for information on building and pushing packages to the Upbound Marketplace.


### `up xpkg` commands

|   |   |
| --- | --- | 
| [`up xpkg build`]({{<ref "build"  >}}) | Creates a Crossplane `XPKG` package. | 
| [`up xpkg init`]({{<ref "init" >}}) | Creates a `crossplane.yaml` package file. | 
| [`up xpkg dep`]({{<ref "dep" >}}) | Caches dependency files for the Crossplane language server. |
| [`up xpkg push`]({{<ref "push" >}}) | Publish a Crossplane `XPKG` package to the Upbound Marketplace. |

