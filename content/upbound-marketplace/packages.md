---
title: "Creating and Pushing Packages"
weight: 30
---

{{< hint type="caution" >}}
This section covers creating and pushing packages to the Upbound Marketplace. For information about installing packages read the <a href="{{<ref "uxp/crossplane-concepts/packages">}}">Crossplane Packages</a> section.
{{< /hint >}}

## Package types
Crossplane supports two package types, `Configurations` and `Providers`.

* **`Configuration`** packages combine Crossplane _Composite Resource Definitions_, _Compositions_ and metadata. 
* **`Provider`** packages combine a [Kubernetes controller](https://kubernetes.io/docs/concepts/architecture/controller/) container, associated _Custom Resource Definitions_ (`CRDs`) and metadata. The Crossplane open source [AWS provider package](https://github.com/crossplane-contrib/provider-aws/tree/master/package) is an example a provider's metadata and `CRDs`.

## Prerequisites

* Building and pushing packages require the [`up` command-line]({{<ref "/cli" >}}).
* Pushing packages requires an [Upbound account]({{<ref "users/register">}}).

## Build a package
Build a package using `up xpkg build`. 

The `up xpkg build` command expects a `crossplane.yaml` file to provide the metadata for the package file. 

The default name is the `metadata.name` value in the `crossplane.yaml` file. 

```shell
up xpkg build
xpkg saved to /home/vagrant/pkg/test-config-15ab02d92a30.xpkg
```

Provide a specific package name with `up xpkg build --name <package name>`.

By default `up xpkg build` saves the package to the current directory. Specify a specific location with `up xpkg build -o <path>`.

The [`up xpkg build` command reference]({{<ref "cli/command-reference/xpkg/build" >}}) contains all available options.

## Push a package
Before pushing a package you must [login]({{<ref "/upbound-marketplace/authentication">}}) to the Upbound Marketplace using `up login`.

### Create a repository
Upbound hosts packages in an Upbound _repository_. Create a repository with the [`up repository create`]({{<ref "cli/command-reference/repository#up-repository-create" >}}) command.

For example, to create a repository called `my-repo`
```shell
up repository create my-repo
upbound-docs/my-repo created
```
{{< hint type="tip" >}}
All repositories are private by default.
{{< /hint >}}

View any existing repositories with `up repository list`.
```shell
up repo list
NAME         TYPE            PUBLIC   UPDATED
my-repo      configuration   false    23h
```

### Push a package to the repository
Push a package to the Upbound Marketplace using the `up xpkg push` command.

The `up xpkg push` command requires:
* The repository to push a package to.
* A package version tag. The package version tag is a <a href="https://semver.org/">semantic versioning</a> number determining package upgrades and dependency requirements.

The push command syntax is  
`up xpkg push <repoository>:<version tag> -f <xpkg file>`.

For example, to push a package with the following parameters:
* Repository `upbound-docs/my-repo`
* Version `v0.2`
* Package file named `my-package.xpkg`

Use the following `up xpkg push` command:

```shell
up xpkg push upbound-docs/my-repo:v0.2 -f my-package.xpkg
xpkg pushed to upbound-docs/my-repo:v0.2
```

{{< hint type="note" >}}
You need to <a href="https://accounts.upbound.io/login">login to the Marketplace</a> to see packages in private repositories.
{{< /hint >}}

The package is now available from the Upbound Marketplace. View the Marketplace listing at:
`https://marketplace.upbound.io/<package_type>/<organization or user>/<repository>/`

For example, the Upbound AWS Official Provider is a `provider` package in the `upbound` organization's `provider-aws` repository. The package address is <a href="https://marketplace.upbound.io/providers/upbound/provider-aws/">`https://marketplace.upbound.io/providers/upbound/provider-aws/`</a>

### Making packages public

Upbound reviews all public packages. To request Upbound to make a package public email support@upbound.io or message the #Upbound channel in the [Crossplane Slack](https://slack.crossplane.io/).

Upbound needs the following information before considering a package:
* Public public Git repository of the package.
* The Upbound account to list as an owner and point of contact.
* The Upbound repository name.