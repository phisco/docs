---
title: "up xpkg push"
---

Publishes images created by `up xpkg build` to the Upbound Marketplace. 

{{<hint type="important" >}}
Users must [authenticate to the Upbound Marketplace]({{<ref "upbound-marketplace/authentication" >}}) to push packages.  
For more information on the requirements to push an image read the [Creating and Pushing Packages]({{<ref "upbound-marketplace/packages" >}}) section. 
{{< /hint >}}


### `up xpkg push`

#### Arguments
* `<tag>` _(required)_ - A `tag` is the organization, repository and version of the image in the format `<organization>/<repository>:<version>`. 
* `-f, --package <file>` _(required)_ - The package from `up xpkg build` to push to the Upbound Marketplace.
* `--create` - Create the repository if it doesn't exist.


#### Examples
* Push a package called `getting-started.xpkg` to the `test` repository inside the `upbound-docs` organization. Mark it as version `v0.2`.

```shell
up xpkg push upbound-docs/test:v0.2 -f getting-started.xpkg
xpkg pushed to upbound-docs/test:v0.2
```