---
title: Project API Reference
description: Reference documentation for the Upbound Project resource
---

import CrdDocViewer from '@site/src/components/CrdViewer';


<!-- vale write-good.Passive = NO -->
<!-- vale write-good.Weasel = NO -->

A `Project` defines an Upbound project, which can be built into a Crossplane
Configuration package. The project file, `upbound.yaml`, is the entry point for
every control plane project and configures metadata, dependencies, paths, and
build options.

<!-- vale Upbound.Spelling = NO -->
:::important
An `upbound.yaml` file is a superset of a [Crossplane configuration][configuration-overview]
`crossplane.yaml` file and replaces it.
:::
<!-- vale Upbound.Spelling = YES -->

## API versions

The Project resource supports two API versions:

| Version | Status | Notes |
|---------|--------|-------|
| `meta.dev.upbound.io/v1alpha1` | Storage version | Stable, recommended for most projects |
| `meta.dev.upbound.io/v2alpha1` | Alpha | Adds `operations` path support |

## Example

A minimal `upbound.yaml`:

```yaml
apiVersion: meta.dev.upbound.io/v1alpha1
kind: Project
metadata:
  name: example-project-aws
spec:
  repository: xpkg.upbound.io/upbound/example-project-aws
```

A project with dependencies and metadata:

```yaml
apiVersion: meta.dev.upbound.io/v2alpha1
kind: Project
metadata:
  name: my-project
spec:
  description: A control plane project for managing cloud resources.
  license: Apache-2.0
  maintainer: Upbound User <user@example.com>
  repository: xpkg.upbound.io/upbound/my-project
  source: github.com/upbound/my-project
  crossplane:
    version: ">=v2.0.0-rc.0"
  dependsOn:
    - apiVersion: pkg.crossplane.io/v1
      kind: Provider
      package: xpkg.upbound.io/upbound/provider-aws-s3
      version: ">=v2.0.0"
  paths:
    apis: apis
    functions: functions
    examples: examples
    tests: tests
```

## Spec fields

### Required

| Field | Type | Description |
|-------|------|-------------|
| `repository` | `string` | The OCI repository to push built packages to. Must be a fully qualified image reference, for example `xpkg.upbound.io/upbound/my-project`. |

### Package metadata

These fields become package metadata when a project is built.

| Field | Type | Description |
|-------|------|-------------|
| `description` | `string` | A short description of the project. |
| `maintainer` | `string` | The project maintainer, for example `Upbound User <user@example.com>`. |
| `source` | `string` | The source code repository URL, for example `github.com/upbound/my-project`. |
| `license` | `string` | The project license, for example `Apache-2.0`. |
| `readme` | `string` | A longer readme for the project. Supports multi-line strings. |
| `additionalMetadata` | `map[string]string` | Arbitrary key-value metadata pairs. All keys must have the `meta.upbound.io/` prefix. |

### Dependencies

| Field | Type | Description |
|-------|------|-------------|
| `crossplane` | `object` | Crossplane version constraints. Contains a `version` field with a semantic version constraint, for example `">=v2.0.0-rc.0"`. |
| `dependsOn` | `[]Dependency` | Package dependencies. Each entry specifies an `apiVersion`, `kind`, `package`, and `version`. |

A dependency entry:

```yaml
dependsOn:
  - apiVersion: pkg.crossplane.io/v1
    kind: Provider
    package: xpkg.upbound.io/upbound/provider-aws-s3
    version: ">=v2.0.0"
```

### Paths

The `paths` field configures the directories for each part of the project. All paths must be relative.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `paths.apis` | `string` | `apis/` | Directory holding the project's APIs (XRDs and compositions). |
| `paths.functions` | `string` | `functions/` | Directory holding embedded composition functions. |
| `paths.examples` | `string` | `examples/` | Directory holding example composite resources. |
| `paths.tests` | `string` | `tests/` | Directory holding composition and end-to-end tests. |
| `paths.operations` | `string` | `operations/` | Directory holding operation definitions. Only available in `v2alpha1`. |

### Build options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `architectures` | `[]string` | `["amd64", "arm64"]` | Target architectures for the built package. |
| `imageConfig` | `[]ImageConfig` | None | Rules for matching and rewriting container image references during build. |

#### Image configuration

Use `imageConfig` to rewrite image references during build. Each entry contains:

- `matchImages`: A list of prefix-based matching rules. Must have at least one element.
- `rewriteImage`: The prefix to use when rewriting matched images.

```yaml
imageConfig:
  - matchImages:
      - type: Prefix
        prefix: "docker.io/library/"
    rewriteImage:
      prefix: "registry.example.com/mirror/"
```

### API dependencies (experimental)

:::warning
This feature is experimental and subject to change.
:::

The `apiDependencies` field declares external API schema dependencies for type
checking and code generation. Each entry requires a `type` (`k8s` or `crd`) and
exactly one source:

| Source | Fields | Description |
|--------|--------|-------------|
| `git` | `repository` (required), `ref`, `path` | Fetch from a Git repository. |
| `http` | `url` (required) | Fetch from an HTTP/HTTPS URL. |
| `k8s` | `version` (required) | Use a specific Kubernetes API version, for example `v1.33.0`. |

```yaml
apiDependencies:
  - type: k8s
    k8s:
      version: v1.33.0
  - type: crd
    git:
      repository: https://github.com/example/crds
      ref: main
      path: deploy/crds
```

## Defaults

When a project is loaded, the following defaults are applied if not specified:

- `paths.apis`: `apis`
- `paths.functions`: `functions`
- `paths.examples`: `examples`
- `paths.tests`: `tests`
- `paths.operations`: `operations` (v2alpha1 only)
- `architectures`: `["amd64", "arm64"]`
- `crossplane.version`: `>=v2.0.0-rc.0` (v2alpha1 only)

## Validation rules

- `metadata.name` must not be empty.
- `spec` must be present.
- `spec.repository` must not be empty.
- All paths must be relative, not absolute.
- If `architectures` is specified, it must not be empty.
- All `additionalMetadata` keys must have the `meta.upbound.io/` prefix.
- Each `apiDependencies` entry must specify exactly one source (`git`, `http`, or `k8s`).

<!-- vale Google.Headings = NO -->
<!-- vale Microsoft.HeadingAcronyms = NO -->
## Full CRD schema
<!-- vale Google.Headings = YES -->
<!-- vale Microsoft.HeadingAcronyms = YES -->

<CrdDocViewer crdUrl="/crds/testing/meta.dev.upbound.io_projects.yaml" />

## Related

- [Upgrade to control plane projects][upgrade-to-projects]
- [Builder's Workshop: Project Foundations][builders-workshop]
- [CLI Reference][cli-reference] for `up project` commands

<!-- vale write-good.Weasel = YES -->
<!-- vale write-good.Passive = YES -->

[configuration-overview]: /reference/apis/crossplane-api/
[upgrade-to-projects]: /manuals/uxp/upgrade-to-projects
[builders-workshop]: /getstarted/builders-workshop/project-foundations/
[cli-reference]: /reference/cli-reference/
