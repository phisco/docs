---
title: "up xpkg init"
---

Provides a wizard to generate a `crossplane.yaml` file for `Configuration` or `Provider` packages.

### `up xpkg init`

#### Arguments
* `-p, --package-root` - The location where the new `crossplane.yaml` file will be written. Must be a location without an existing `crossplane.yaml` file. Default is the current directory.
* `-t, --type [configuration | provider]` - Runs a `configuration` wizard or `provider` wizard to generate the specific `crossplane.yaml` file.
  

#### Examples
* Generate a `Configuration` package file.
```shell
up xpkg init
Package name: my_configuration
What version contraints of Crossplane will this package be compatible with? [e.g. v1.0.0, >=v1.0.0-0, etc.]: >=v1.8.0-0
Add dependencies? [y/n]: y
Provider URI [e.g. crossplane/provider-aws]: xpkg.upbound.io/crossplane/provider-aws
Version constraints [e.g. 1.0.0, >=1.0.0-0, etc.]: >=v0.24.1
Done? [y/n]: y
xpkg initialized at /home/user/crossplane.yaml
```

<br />

```shell
cat crossplane.yaml
apiVersion: meta.pkg.crossplane.io/v1
kind: Configuration
metadata:
  name: my_configuration
spec:
  crossplane:
    version: '>=v1.8.0-0'
  dependsOn:
  - provider: xpkg.upbound.io/crossplane/provider-aws
    version: '>=v0.24.1'
```

* Generate a `Provider` package file.

```shell
up xpkg init -t provider -p provider-init/
Package name: my-provider
What version contraints of Crossplane will this package be compatible with? [e.g. v1.0.0, >=v1.0.0-0, etc.]: >=1.9.0-0
Controller image: my-controller
xpkg initialized at /home/user/provider-init/crossplane.yaml
```

<br />

```shell
cat /home/vagrant/provider-init/crossplane.yaml
apiVersion: meta.pkg.crossplane.io/v1
kind: Provider
metadata:
  name: my-provider
spec:
  controller:
    image: my-controller
  crossplane:
    version: '>=1.9.0-0'