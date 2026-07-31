---
title: Upgrade to Control Plane Projects
description: Adopt control plane projects
sidebar_position: 3
---

If you're already running Crossplane and want to use Upbound Crossplane's
control plane tooling, you can upgrade to projects.

The next section shows you the steps to upgrade existing Crossplane compositions
into a control plane project.

## Prerequisites

Make sure you have:

* [An account on Upbound][up-account]
* [The up CLI installed][up-cli]
* A Docker-compatible container engine, such as [Docker Desktop][docker-desktop], running

## Initialize a project

Log in to Upbound:

```shell
up login
```

A [control plane project][project] is the source-level representation of your
control plane. Projects contain all the definitions and configurations needed to
build a control plane.

```shell
up project init --scratch upbound-project && cd upbound-project
```

This command:

* Creates a new directory called `upbound-project`
* Sets up the basic project structure with necessary configuration files

### Review the project structure

#### `upbound.yaml`

The `upbound.yaml` file is the main configuration that:

* Defines project metadata (name, organization)
* Sets configuration parameters for builds and deployments

This file is the project entry point and tells Upbound what this
project is and where it belongs. 

<!-- vale Upbound.Spelling = NO -->
:::important

An `upbound.yaml` is a superset of a [Crossplane configuration][configuration-overview] `crossplane.yaml` and replaces it.

:::
<!-- vale Upbound.Spelling = YES -->
#### `apis/` directory

The `apis/` directory is for your composite resource definitions (XRDs) and compositions.

* **XRDs (Composite Resource Definitions)**: Define your custom resource APIs
* **Compositions**: Define the API implementation logic

Each composite type belongs in its own folder under the `apis/` directory.

#### `examples/` directory

The `examples/` directory is for example instances of your composites.

#### `functions/` directory

The `functions/` directory contains embedded functions used in your composition and operation pipelines. Upbound calls these _embedded functions_ because of the convention and workflow that a project implements:

- A project gets built into a Crossplane Configuration, which is an OCI package, and gets pushed to a repository.
- Functions defined in this directory get built into their own OCI package and get pushed into a sub-repository of the project.
- The embedded function convention enables project tooling to offer rich in-editor experiences in your preferred IDE.

## Import dependencies
<!-- vale Upbound.Spelling = NO -->
Because the `upbound.yaml` is a superset of a `crossplane.yaml`, you should
define your project's dependencies here. The project file should declare all
packages your control plane requires in the `spec.dependsOn` field.
<!-- vale Upbound.Spelling = YES -->

Use the [up dependency add][up-dep] command to bring any providers, functions,
configurations, or other supported package types into your project's context.
Here's an example for adding a dependency on `provider-aws-s3`:

```shell
up dependency add xpkg.upbound.io/upbound/provider-aws-s3
```

Project tooling uses this package information to generate resource schemas to power rich in-editor experiences in your IDE.

## Import composite types

Move your existing composite types into the `/apis` directory of your project. Each composite should belong to its own folder. The example below shows how this would look if you had composite types for `Apps` and `Buckets`:

```shell
.
└── upbound-project/
    └── apis/
        ├── apps/
        │   ├── composition.yaml
        │   └── definition.yaml
        ├── buckets/
        │   ├── composition.yaml
        │   └── definition.yaml
        └── ...
```

:::tip

Want to define a new composite type? Use the [project tooling][scaffold-api] to scaffold a new API.

:::

## Build and run your project

You can now build and deploy your project. Deploy it locally first:

```shell
up project run --local
```

Wait for the control plane to become ready, then confirm it's configured as you expect:

```shell
# Look for installed dependencies, such as providers
kubectl get pkg

# Look for installed composite types
kubectl get xrds
```

Build and push your project to an OCI registry such as the Upbound Marketplace to deploy your package into production:

```shell
up project build && up project push
```

Deploy it in production:

* Deploy on a [self-managed UXP][self-managed-uxp] cluster.
* Deploy it on a control plane [in a Space][spaces].

## Optional: Refactor compositions

<!-- vale write-good.TooWordy = NO -->
:::tip

This step is **highly recommended** to enable a richer project-based experience,
but isn't a requirement.

:::

<!-- vale write-good.TooWordy = YES -->

To take full advantage of the project experience, you should define the functions in your composition and operation pipelines as _embedded functions_. Upbound platform supports a multi-language experience.

### Go-templating example

[Go-templating][go-templ] is a popular function to use for building compositions. This example demonstrates how to refactor a composition built with this function into an embedded function.

Suppose the composition looks like this:

```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: example
spec:
  compositeTypeRef:
    apiVersion: example.crossplane.io/v1beta1
    kind: XBucket
  mode: Pipeline
  pipeline:
    - step: create-a-bucket
      functionRef:
        name: function-go-templating
      input:
        apiVersion: gotemplating.fn.crossplane.io/v1beta1
        kind: GoTemplate
        source: Inline
        inline:
          template: |
            apiVersion: s3.aws.upbound.io/v1beta1
            kind: Bucket
            metadata:
              annotations:
                gotemplating.fn.crossplane.io/composition-resource-name: bucket
            spec:
              forProvider:
                region: {{ .observed.composite.resource.spec.region }}
    - step: automatically-detect-ready-composed-resources
      functionRef:
        name: function-auto-ready
```

Start by moving the composition into the project as described in the [import composite types][import-composite-types] section.

Generate an embedded function in the project:

```shell
up function generate --language=go-templating compose-bucket apis/xbuckets/composition.yaml
```

This command does two things:
<!-- vale Google.WordList = NO -->
1. scaffolds an embedded function for go-templating in the `functions/` directory.
2. appends the embedded function to the composition above.
<!-- vale Google.WordList = YES -->

<!-- vale Upbound.Spelling = NO -->
Move the in-line templated YAML from the existing `composition.yaml` and paste
it in the embedded function's `01-compose.yaml.gotmpl` in the
`functions/compose-bucket/` directory. It should look like this:
<!-- vale Upbound.Spelling = YES -->

```yaml
# code: language=yaml
# yaml-language-server: $schema=../../.up/json/models/index.schema.json

apiVersion: s3.aws.upbound.io/v1beta1
kind: Bucket
metadata:
    annotations:
    gotemplating.fn.crossplane.io/composition-resource-name: bucket
spec:
    forProvider:
    region: {{ .observed.composite.resource.spec.region }}
```

The comments at the top are directives used by the project tooling to support intellisense-style experiences in your IDE. **Don't** remove them.

Remove the `create-a-bucket` step in the composition pipeline in the
`composition.yaml`. The embedded function performs this step and is already
present in the composition pipeline

You're finished. You've refactored a composition to use embedded functions.

## Next steps

Read the [concept][project-concept] documentation to learn more about using projects.

[up-account]: https://www.upbound.io/register/?utm_source=docs&utm_medium=cta&utm_campaign=docs_upgrade
[up-cli]: /manuals/cli/overview
[docker-desktop]: https://www.docker.com/products/docker-desktop/
[project]: /manuals/cli/howtos/project 
[configuration-overview]: /manuals/uxp/concepts/packages/configurations#the-crossplaneyaml-file
[up-dep]: /reference/cli-reference/#up-dependency-add
[scaffold-api]: /manuals/cli/howtos/authoring-xrds/
[self-managed-uxp]: /manuals/uxp/howtos/uxp-deployment
[spaces]: /self-hosted-spaces/overview
[project-concept]: /manuals/cli/howtos/project
[go-templ]: https://marketplace.upbound.io/functions/upbound/function-go-templating
[import-composite-types]: #import-composite-types
