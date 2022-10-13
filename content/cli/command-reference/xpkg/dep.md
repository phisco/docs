---
title: "up xpkg dep"
---

Downloads the dependencies of a package for the Crossplane Language Server.

{{<hint type="note" >}}
This cache is only for the Crossplane Language Server. This doesn't cache files for Crossplane images.
{{< /hint >}}

### `up xpkg dep`

#### Arguments
* `<Configuration file>` - The _Configuration_ file to cache dependencies. Defaults to `./crossplane.yaml`. 
* `-d, --cache-dir` - The location of the cache directory. Defaults to `~/.up/cache/`.
* `-c, --clean-cache` - Removes all files in the cache directory. 


#### Examples

* Download and cache the dependency files for an example _Configuration_ package.
```shell
cat crossplane.yaml
apiVersion: meta.pkg.crossplane.io/v1
kind: Configuration
metadata:
  name: my-pkg
spec:
  crossplane:
    version: '>=v1.8.0-0'
  dependsOn:
  - provider: crossplane/provider-aws
    version: '>=v0.14.0'
```
<br />

```shell
up xpkg dep
Dependencies added to xpkg cache:
- crossplane/provider-aws (v0.32.0)
```