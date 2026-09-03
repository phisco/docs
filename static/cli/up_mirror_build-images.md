---
mdx:
  format: md
---

Mirror all container images required for building projects.

The `build-images` command mirrors all container images needed to build
projects, including function base images and the images used to generate
schemas and run tests.

When mirroring to a destination registry, the command prints the
`imageConfig` entries to add to a project's `upbound.yaml` so that project
builds pull the images from the mirror instead of the upstream registries.

#### Examples

Copy all required build images to your container registry. Note that you must
log in to the mirror registry first using a command like
`docker login myregistry.io`:

```shell
up mirror build-images --destination-registry=myregistry.io
```

Save all build images as `.tgz` files in a local directory. The images are
pulled using your local Docker credentials:

```shell
up mirror build-images --output-dir=/tmp/output
```

Mirror only the images required for specific languages. The flag may be
repeated or given as a comma-separated list:

```shell
up mirror build-images --destination-registry=myregistry.io --language=kcl,python
```

Print the images that would be copied to your registry without mirroring
them. A request is made to the source registry to confirm the images are
available:

```shell
up mirror build-images --destination-registry=myregistry.io --dry-run
```

Print the images that would be saved to a local directory without mirroring
them:

```shell
up mirror build-images --output-dir=/tmp/output --dry-run
```


#### Usage

`up mirror build-images [flags]`
#### Flags

| Flag | Short Form | Description |
| ---- | ---------- | ----------- |
| `--output-dir` | `-o` | The local directory path where exported artifacts will be saved as .tgz files. |
| `--destination-registry` | `-r` | The target container registry where the artifacts will be mirrored. |
| `--language` | `-l` | Limit mirroring to the given project languages. May be repeated or comma-separated. Defaults to all languages. |
| `--dry-run` | | Print what would be mirrored but do not take action. |
