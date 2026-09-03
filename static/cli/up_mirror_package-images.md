---
mdx:
  format: md
---

Mirror Crossplane packages and all their dependencies recursively.

The `package-images` command mirrors a Crossplane package and all of its
transitive dependencies, resolved recursively. The dependency constraints of
the package are resolved to concrete versions first, so the mirrored set is
the resolved dependency closure, not every version that satisfies the
constraints.

Resolving the dependency graph downloads each package into the local package
cache (see `--cache-dir`), so the first run for a large package tree takes a
while; subsequent runs reuse the cache. Packages are mirrored concurrently;
tune the parallelism with `--concurrency`.

When mirroring to a destination registry, the command prints the
`imageConfig` entries to add to a project's `upbound.yaml` so that project
builds pull the packages from the mirror instead of the upstream registries.

#### Examples

Copy the package and all its dependencies to your container registry. Note
that you must log in to the mirror registry first using a command like
`docker login myregistry.io`:

```shell
up mirror package-images xpkg.upbound.io/upbound/provider-aws-s3:v1.17.0 --destination-registry=myregistry.io
```

Save the package and all its dependencies as `.tgz` files in a local
directory:

```shell
up mirror package-images xpkg.upbound.io/upbound/provider-aws-s3:v1.17.0 --output-dir=/tmp/output
```

Print the packages that would be mirrored without mirroring them. The package
and its dependencies are still resolved against the source registry:

```shell
up mirror package-images xpkg.upbound.io/upbound/provider-aws-s3:v1.17.0 --destination-registry=myregistry.io --dry-run
```


#### Usage

`up mirror package-images <package> [flags]`
#### Arguments

| Argument | Description |
| -------- | ----------- |
| `<package>` | Package to mirror (e.g. xpkg.upbound.io/upbound/provider-aws-s3:v1.17.0). |
#### Flags

| Flag | Short Form | Description |
| ---- | ---------- | ----------- |
| `--domain` | | Root Upbound domain. Overrides the current profile's domain. |
| `--profile` | | Profile used to execute command. |
| `--account` | `-a` | Deprecated. Use organization instead. |
| `--organization` | | Organization used to execute command. Overrides the current profile's organization. |
| `--ca-bundle` | | Path to CA bundle file to prepend to existing CAs |
| `--insecure-skip-tls-verify` | | [INSECURE] Skip verifying TLS certificates. |
| `--debug` | `-d` | [INSECURE] Run with debug logging. Repeat to increase verbosity. Output might contain confidential data like tokens. |
| `--override-api-endpoint` | | Overrides the default API endpoint. |
| `--override-auth-endpoint` | | Overrides the default auth endpoint. |
| `--override-proxy-endpoint` | | Overrides the default proxy endpoint. |
| `--override-registry-endpoint` | | Overrides the default registry endpoint. |
| `--override-accounts-endpoint` | | Overrides the default accounts endpoint. |
| `--kubeconfig` | | Override default kubeconfig path. |
| `--kubecontext` | | Override default kubeconfig context. |
| `--output-dir` | `-o` | The local directory path where exported artifacts will be saved as .tgz files. |
| `--destination-registry` | `-r` | The target container registry where the artifacts will be mirrored. |
| `--dry-run` | | Print what would be mirrored but do not take action. |
| `--cache-dir` | | Directory used for caching package images. |
| `--concurrency` | | Maximum number of packages to mirror concurrently. |
