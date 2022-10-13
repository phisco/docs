---
title: "up xpkg build"
---

The `up xpkg build` command builds Open Container Initiative compliant images of a set of configuration files. Use this image to create a specific Crossplane control-plane or Provider.

{{<hint type="important" >}}
For more information on the requirements to build an image read the [Creating and Pushing Pacakges]({{<ref "upbound-marketplace/packages" >}}) section. 
{{< /hint >}}

### `up xpkg build`

#### Arguments
* `-o, --output <path>` - The path and filename of the Crossplane package. The default name is from the `metadata.name` value in `crossplane.yaml`.
* `--controller <path>` - The path to a controller image to use for a `Provider` configuration image.
* `-f, --package-root` - The path to the directory containing files to package into an `xpkg` file. The default is the current directory.
* `-e, --examples-root` - The path to a directory of examples on how to use this configuration image.
  

The `up xpkg build` command supports two different image types:
* `Configuration` - Configuration images consist of _Custom Resource Definitions_, _Compositions_ and package metadata which define a custom control-plane.
* `Provider` - An image consisting of a provider controller and all related Custom Resource Definitions. The Crossplane `crossplane-contrib` repository contains the packages used for open source Crossplane Providers. For example, the [image contents for `provider-aws`](https://github.com/crossplane-contrib/provider-aws/tree/master/package).


#### Examples
* Create a _Configuration_ package.
```shell
up xpkg build -o my_control_plane.xpkg
xpkg saved to my_control_plane.xpkg
```

* Create a _Provider_ package.
```shell
xpkg build \
--controller my_controller-amd64 \
--package-root ./package \
--examples-root ./examples \
--output ./my_provider.xpkg
xpkg saved to my_provider.xpkg
```
