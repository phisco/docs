---
title: "Publishing to Upbound Marketplace" 
metaTitle: "Publishing to Upbound Marketplace" 
metaDescription: "Publishing to Upbound Marketplace" 
rank: 31
---

## Requirements

This guide works best if you've worked through the [build a configuration] guide
already. You'll need the the [Upbound CLI] installed to build and push
[Crossplane packages][package].

## Build a Package

Both Providers and Configurations can be built into a Crossplane Package that
can be pushed to the Upbound Marketplace. Follow the [build a configuration]
guide to build a "getting started" Crossplane Configuration package which can be
uploaded to the Upbound Marketplace.

## Create a Repository in an Upbound Account

Next, before we build the repository we just published, you'll need to create a
new Repository in an Upbound account. All repositories are private when
initially created, but can be made public on the settings page. Private
repositories are only able to be pulled by users that have access to the
repository, while public repositories may be pulled by anyone.

## Push to Your Repository

Once you've created your Repository, all you have to do is push the package to
it with the following commands.

```console
# Login to ensure you have the proper credentials to push
up login

# Push the getting started package
UBC_ACCOUNT=exampleorg
UBC_REPO=examplerepo
VERSION_TAG=v0.0.1
up xpkg push ${UBC_ACCOUNT}/${UBC_REPO}:${VERSION_TAG} -f getting-started.xpkg
```

You should see the package show up in the list on the repository page, and after
a few moments a status should appear. The status will be one of the following:

- `Received`: package has been received but is yet to be validated.
- `Rejected`: package is invalid and will not be installed successfully. It can
  still be pulled, but it should not be expected to work when installed.
- `Accepted`: package has been validated and should be expected to install
  properly.
- `Published`: package has been validated and has been published to the Upbound
  Marketplace.

All packages must use [semantic version] tags, and only release versions (e.g.
`vX.Y.Z`) will be published to the Marketplace. If a repository is private, only
users who have access to the repository will see the package in the Marketplace.

[Upbound CLI]: ../../cli
[package]: https://crossplane.io/docs/master/concepts/packages.html
[build a configuration]: ../../uxp/build-configuration
[semantic version]: https://semver.org/