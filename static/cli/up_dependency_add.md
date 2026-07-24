---
mdx:
  format: md
---

Add a dependency to the current project.

The `add` command retrieves a Crossplane package from a specified registry with
an optional version tag and adds it to a project as a dependency. Language
schemas will be added to the project if the package provides them.

API dependencies can be added using the `--api` flag. This automatically
generates schemas for the dependency.

#### Crossplane Core Dependencies

Crossplane core resources (`Composition`, `Usage`, etc.) can be added as an API
dependency using the `crossplane:&lt;uxp version>` syntax. Both upstream Crossplane
resources and UXP-specific resources are included. CRDs are extracted from the
UXP container images, by default:

* `xpkg.upbound.io/upbound/crossplane:&lt;version>` for Crossplane core resources.
* `xpkg.upbound.io/upbound/controller-manager:&lt;version>` for UXP resources.

These image locations can be overridden by configuring `spec.imageConfig` in the
`upbound.yaml` file.

#### Examples

Retrieve the latest available version of the EKS provider, add all CRDs to the
cache folder, and place language schemas in the project's `.up/` folder:

```shell
up dependency add xpkg.upbound.io/upbound/provider-aws-eks
```

Retrieves the latest available version greater than `v1.1.0` of the
`platform-ref-aws` configuration, add all XRDs to the cache folder, and place
language schemas in the project's `.up/` folder:

```shell
up dependency add 'xpkg.upbound.io/upbound/platform-ref-aws:>v1.1.0'
```

Retrieves version `v0.4.1` of `function-status-transformer`:

```shell
up dependency add 'xpkg.upbound.io/crossplane-contrib/function-status-transformer:>v0.4.1'
```

Add core resources from Kubernetes v1.33.0 as an API dependency, adding language
schemas to the project's `.up/` folder:

```shell
up dependency add --api k8s:v1.33.0
```

Add Crossplane's core resources at UXP version v2.3.3-up.3 as an API dependency,
adding language schemas to the project's `.up/` folder:

```shell
up dependency add --api crossplane:v2.3.3-up.3
```

Add a specific CRD from an HTTP URL as an API dependency, adding language
schemas to the project's `.up/` folder:

```shell
up dependency add --api https://raw.githubusercontent.com/cert-manager/cert-manager/refs/heads/master/deploy/crds/cert-manager.io_certificaterequests.yaml
```

Add CRDs from a git repository as an API dependency, adding language schemas to
the project's `.up/` folder:

```shell
up dependency add --api https://github.com/kubernetes-sigs/cluster-api \
    --git-ref=release-1.11 --git-path=config/crd/bases
```


#### Usage

`up dependency add <package> [flags]`
#### Arguments

| Argument | Description |
| -------- | ----------- |
| `<package>` | Package to be added. |
#### Flags

| Flag | Short Form | Description |
| ---- | ---------- | ----------- |
| `--git-token` | | Token for git HTTPS authentication (GitHub PAT, GitLab token, etc.). |
| `--git-username` | | Username for git HTTPS authentication. Defaults to 'x-access-token'. Use your Bitbucket username for Bitbucket app passwords. |
| `--git-proxy` | | Proxy URL for git operations (e.g., http://proxy:8080). Supports HTTP CONNECT for SSH tunneling. |
| `--git-insecure-host-key` | | Skip SSH host key verification. Only use if you understand the MITM risks. |
| `--project-file` | `-f` | Path to project definition file. |
| `--api` | | Treat the dependency as an API dependency (k8s, crossplane, or CRD). |
| `--git-ref` | | Git ref for CRD dependencies (branch, tag, or commit SHA). If provided, the CRD will be fetched from git. |
| `--git-path` | | Path within the git repository for CRD dependencies. |
| `--cache-dir` | | Directory used for caching package images. |
