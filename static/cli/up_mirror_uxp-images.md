---
mdx:
  format: md
---

Mirror the UXP Helm chart and all container images required to install it.

The `uxp-images` command mirrors the Helm chart and all container images
needed to install Upbound Crossplane (UXP) into a local directory or a
private container registry, for use in offline or airgapped environments.

The set of images is determined by the chart version you request and covers
everything a default installation needs at runtime.

When mirroring to a registry, the command prints the Helm values needed to
install UXP from your mirror.

#### Examples

Copy the chart and all images for UXP 2.3.1-up.1 to your container registry.
Note that you must log in to the mirror registry first using a command like
`docker login myregistry.io`:

```shell
up mirror uxp-images -v 2.3.1-up.1 --destination-registry=myregistry.io
```

Save the chart and all images as `.tgz` files in a local directory:

```shell
up mirror uxp-images -v 2.3.1-up.1 --output-dir=/tmp/output
```

Print what would be mirrored without mirroring anything:

```shell
up mirror uxp-images -v 2.3.1-up.1 --destination-registry=myregistry.io --dry-run
```


#### Usage

`up mirror uxp-images --version=STRING [flags]`
#### Flags

| Flag | Short Form | Description |
| ---- | ---------- | ----------- |
| `--output-dir` | `-o` | The local directory path where exported artifacts will be saved as .tgz files. |
| `--destination-registry` | `-r` | The target container registry where the artifacts will be mirrored. |
| `--version` | `-v` | **Required** The UXP chart version for which the images will be mirrored. |
| `--dry-run` | | Print what would be mirrored but do not take action. |
| `--concurrency` | | Maximum number of images to mirror concurrently. |
