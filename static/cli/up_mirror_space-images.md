---
mdx:
  format: md
---

Mirror all container images required for a specific version of Upbound Spaces.

The `space-images` command mirrors all required container images for a
specific version of Upbound Spaces.

#### Examples

Mirror all images for Upbound Spaces version 1.9.0 into a local directory as
`.tgz` files, using the token file for authentication:

```shell
up mirror space-images -v 1.9.0 --output-dir=/tmp/output --token-file=upbound-token.json
```

Mirror all images for Upbound Spaces version 1.9.0 to a specified container
registry, using the token file for authentication. Note that you must log in
to the mirror registry first using a command like `docker login myregistry.io`:

```shell
up mirror space-images -v 1.9.0 --destination-registry=myregistry.io --token-file=upbound-token.json
```

Print the images that would be mirrored into a local directory for Upbound
Spaces version 1.9.0, using the token file for authentication. A request is
made to the Upbound registry to confirm network access:

```shell
up mirror space-images -v 1.9.0 --output-dir=/tmp/output --token-file=upbound-token.json --dry-run
```


#### Usage

`up mirror space-images --version=STRING [flags]`
#### Flags

| Flag | Short Form | Description |
| ---- | ---------- | ----------- |
| `--registry-repository` | | Set registry for where to pull OCI artifacts from. This is an OCI registry reference, i.e. a URL without the scheme or protocol prefix. |
| `--registry-endpoint` | | Set registry endpoint, including scheme, for authentication. |
| `--token-file` | | File containing authentication token. Expecting a JSON file. Example: {"accessId": "<access-id>", "token": "<token>"} |
| `--registry-username` | | Set the registry username. |
| `--registry-password` | | Set the registry password. |
| `--output-dir` | `-o` | The local directory path where exported artifacts will be saved as .tgz files. |
| `--destination-registry` | `-r` | The target container registry where the artifacts will be mirrored. |
| `--version` | `-v` | **Required** The specific Spaces version for which the artifacts will be mirrored. |
| `--dry-run` | | Print what would be mirrored but do not take action. |
