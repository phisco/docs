---
title: Create a project
sidebar_position: 4
description: The source of your control plane configurations. A control plane project
  contains the `upbound.yaml` file and any dependencies for your project.
---

This guide explains how to create and configure a control plane project and build custom
infrastructure APIs.

Control plane projects are source-level representations of your control plane.

Use this guide when you're ready to start building control plane projects after
completing the Builder's Workshop. If you want to try Upbound Crossplane for the
first time, try the [Quickstart][quickstart] instead.

## Prerequisites

Before you begin, make sure you have:

* Finished the [Builder's Workshop][workshop]
* Installed the `up` CLI
* A Docker compatible runtime running

:::tip 
**Podman users**
If you're using Podman instead of Docker, set the `DOCKER_HOST` environment variable to the Podman socket before running `up` commands:

```shell
export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock
```
:::

## Initialize your project

Choose your starting approach based on your goals:

The `up` CLI allows you to choose between an empty project or an AWS S3
Bucket base. To an empty project use:

<EditCode language="shell">
{`
up project init $@YOUR_CONTROL_PLANE$@ --scratch
`}
</EditCode>

This command creates a new directory with your project name.

Your project directory contains:

* `upbound.yaml` - Project configuration file
* `apis/` - Directory for your custom resource definitions
* `functions/` - Directory for business logic functions
* `examples/` - Directory for sample resources
* `tests/` - Directory for automated tests

## `upbound.yaml`

Projects require an `upbound.yaml` file. The command `up project init` by
default uses an Upbound-provided template, which creates a predefined
`upbound.yaml`. If you choose to override the default template with your own,
make sure your template contains an `upbound.yaml` in the root directory.

Project files define the constraints and dependencies of your control plane. The
project file also contains metadata about your project, such as the maintainers
of the project and which template it's derived from.

A typical `upbound.yaml` file looks like the following:

```yaml
apiVersion: meta.dev.upbound.io/v1alpha1
kind: Project
metadata:
  name: platform-api
spec:
  dependsOn:
  - function: xpkg.upbound.io/crossplane-contrib/function-auto-ready
    version: '>=v0.0.0'
  description: This is where you can describe your project.
  license: Apache-2.0
  maintainer: Upbound User <user@example.com>
  readme: |
    This is where you can add a readme for your project.
  repository: xpkg.upbound.io/upbound/platform-api
  source: github.com/upbound/project-template
```

The control plane project defines:

- your platform API schemas, which you express as a collection of
  `CompositeResourceDefinitions (XRDs)`.
- the implementation of those schemas, defined as Crossplane `compositions`.
- any dependencies your control plane has, such as on providers, functions, or
  configuration packages.
- compositions functions, which are modules referenced by your compositions that
  define how to compose resources.
- test suites for your API, so you can conduct testing as part of your
  inner-loop development.
- example manifests for your API.

## Project structure

When you initialize a project, the default project directory structure is:

```bash
├── upbound.yaml # Your control plane project is defined here
├── apis/ # Each API (XRD and composition) are defined here
│   ├── SuperBucket/
│   │   ├── definition.yaml
│   │   └── composition.yaml
│   ├── SuperDatabase/
│   │   ├── definition.yaml
│   │   └── composition.yaml
├── functions/ # Define reusable function modules used by compositions
│   ├── bucketFunction/
│   │   └── main.k
│   ├── databaseFunction/
│   │   └── main.py
├── tests/ # Define test suites for your API
│   ├── e2etest-SuperBucket/
│   │   └── main.k
│   ├── test-SuperBucket/
│   │   └── main.py
├── examples/ # Define example manifests for your API
│   ├── SuperBucket/
│   │   └── example.yaml
│   ├── SuperDatabase/
│   │   └── example.yaml
└── _output/ # "up project build" places the OCI image output here.
```
<!-- vale gitlab.Substitutions = YES -->
## Project templates

New projects created with the command `up project init` scaffold a project from
a default template source,
[github.com/upbound/project-template][github-com-upbound-project-template]. You
can use any Git repository as the template source. You can specify the template
by providing either a full Git URL or a well-known template name. You can use
the following well-known template names:

  - project-template `(https://github.com/upbound/project-template)`
  - project-template-ssh `(git@github.com:upbound/project-template.git)`

To initialize with a custom template:

```shell
up project init my-project --template github.com/{your-org}/{custom-template}
--language=kcl|go|python
```

For more information, review the [CLI reference documentation][cli-reference-documentation].

## Next steps

Next, you need to add the necessary dependencies to enable Upbound communication
with your cloud providers and services. Proceed to the [add dependencies to your
project][add-dependencies-to-your-project] guide.

[quickstart]: /getstarted/builders-workshop/project-foundations
[workshop]: /getstarted/builders-workshop/project-foundations
[up-project-init]: /reference/cli-reference
[cli-reference-documentation]: /reference/cli-reference
[add-dependencies-to-your-project]: /manuals/cli/howtos/adding-dependencies
[github-com-upbound-project-template]: https://github.com/upbound/project-template
