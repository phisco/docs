---
title: Create a composition with Go Templates
sidebar_position: 2
description: Use Go Templates to create resources with your control plane.
aliases:
    - /core-concepts/authoring-compositions
---

Upbound Crossplane allows you to choose how you want to write your composition logic based on your preferred language.

You can choose:

[Go][go] - High performance. IDE support with full type safety.

**Go Templating (this guide)** - Good for YAML-like configurations. IDE support with YAML
language server.

[KCL][kcl] - Concise. Good for transitioning from another configuration language
like `HCL`. IDE support with language server.

[Python][python] - Highly accessible, supports complex logic. Provides type hints and
autocompletion in your IDE.

<!-- vale gitlab.HeadingContent = NO -->
## Overview
<!-- vale gitlab.HeadingContent = YES -->

This guide explains how to create compositions that turn your XRs into actual
cloud resources. Compositions allow you to implement the business logic that
powers your control plane.

Use this guide after you define your API schema and need to write the logic that creates and manages the underlying resources.

Upbound supports defining your control plane APIs using YAML with [Go templates][go-templates]. Go templating functions can make use of all built-in Go templating features and anything supported by Crossplane's [function-go-templating][function-go-templating].

<!-- vale write-good.Passive = NO -->
You can organize templates into multiple files with an arbitrary directory structure, as long as all files have the `.gotmpl` file extension. Templates are read in lexical order and concatenated with YAML separators (`---`) between them.

## Prerequisites

Before you begin, make sure:

* You designed your XRD
* You've added provider dependencies
* You understand your XRD schema and what resources you need to create
* YAML Visual Studio Code extension is installed
* Modelines extension is installed (optional)
<!-- vale write-good.Passive = YES -->

## Create your composition scaffold

Use the XRD you created in the previous step to generate a new composition:

```shell
up composition generate apis/<your_resource_name>/definition.yaml
```

This command creates `apis/<your_resource_name>/composition.yaml` which references the XRD.

## Generate your function

Use your chosen programming language to generate a new function:

```shell
up function generate --language=go-templating compose-resources
apis/<your_resource_name>/composition.yaml
```

This command creates a `functions/compose-resources` directory with your function code and updates your composition file to reference it.

Below is an example function file in `functions/compose-resources/01-compose.yaml.gotmpl`:

```yaml
# code: language=yaml
# yaml-language-server: $schema=../../.up/json/models/index.schema.json

---
apiVersion: s3.aws.upbound.io/v1beta1
kind: Bucket
metadata:
  annotations:
    {{ setResourceNameAnnotation "bucket" }}
spec:
  forProvider:
    region: "{{ $xr.spec.parameters.region }}"
```

## Create your function logic

The following example function composes an S3 bucket based on a simplified bucket XRD:

```yaml
# code: language=yaml
# yaml-language-server: $schema=../../.up/json/models/index.schema.json

---
apiVersion: s3.aws.upbound.io/v1beta1
kind: Bucket
metadata:
  annotations:
    {{ setResourceNameAnnotation "bucket" }}
spec:
  forProvider:
    region: "{{ $xr.spec.parameters.region }}"
```

<details>

<summary>A more advanced Go templating function</summary>

<!-- vale write-good.Passive = NO -->
The files below take a composite resource (XR) as input and produces managed resources (MRs) from the [S3 provider][s3-provider] based on its parameters. The templates are split across multiple files for readability.
<!-- vale write-good.Passive = YES -->

The function always composes an S3 bucket. When the S3 bucket exists, it also composes a bucket access control list (ACL). The ACL references the bucket by name.

If the composite resource's `spec.versioning` field is `true`, the function enables versioning by composing a bucket versioning configuration. Like the ACL, the versioning configuration references the bucket by name.

As a best practice, place any Go templating flow control (`if` statements, loops, variable assignments, etc.) in YAML comments, as demonstrated below. While not required, this avoids confusing the YAML language server with non-YAML syntax, leading to a better editor experience.

### 00-prelude.yaml.gotmpl

<!-- vale write-good.TooWordy = NO -->
This file contains generated boilerplate to place the observed composite
resource and its parameters in Go templating variables, for use by subsequent
templates.
<!-- vale write-good.TooWordy = YES -->

```yaml
#{{ $xr := getCompositeResource . }}
#{{ $params := $xr.spec.parameters }}
```

### 01-bucket.yaml.gotmpl

This file creates the `Bucket` MR. It then checks whether Crossplane has assigned an external name for the bucket and places the name in a variable.

```yaml
# code: language=yaml
# yaml-language-server: $schema=../../.up/json/models/index.schema.json

---
apiVersion: s3.aws.upbound.io/v1beta1
kind: Bucket
metadata:
  annotations:
    {{ setResourceNameAnnotation "bucket" }}
spec:
  forProvider:
    region: "{{ $params.region }}"

# The desired ACL, encryption, and versioning resources all need to refer to the
# bucket by its external name, which is stored in its external name
# annotation. Fetch the external name into a variable so subsequent templates
# can use it.
#
#{{ $bucket := getComposedResource . "bucket" }}
#{{ $bucket_external_name := "" }}
#{{ if $bucket }}
#{{ $bucket_external_name = get $bucket.metadata.annotations "crossplane.io/external-name" }}
#{{ end }}
```

### 02-acl.yaml.gotmpl

This file creates the `BucketACL` MR. Since this MR requires the bucket's external name, the template produces the MR only when the external name is available.

```yaml
# code: language=yaml
# yaml-language-server: $schema=../../.up/json/models/index.schema.json

# Don't create the ACL until the bucket name is available.
#{{ if $bucket_external_name }}
---
apiVersion: s3.aws.upbound.io/v1beta1
kind: BucketACL
metadata:
  annotations:
    {{ setResourceNameAnnotation "acl" }}
spec:
  forProvider:
    region: "{{ $params.region }}"
    bucket: "{{ $bucket_external_name }}"
    acl: "{{ $params.acl }}"
#{{ end }}
```

### 03-versioning.yaml.gotmpl

This file creates the `BucketVersioning` MR when the XR has versioning enabled. Like the `BucketACL`, this MR requires the bucket's external name, so the template produces the MR only after the external name is available.

```yaml
# code: language=yaml
# yaml-language-server: $schema=../../.up/json/models/index.schema.json

#{{ if $params.versioning }}
# Don't create the BucketVersioning until the bucket name is available.
#{{ if $bucket_external_name }}
---
apiVersion: s3.aws.upbound.io/v1beta1
kind: BucketVersioning
metadata:
  annotations:
    {{ setResourceNameAnnotation "versioning" }}
spec:
  forProvider:
    region: "{{ $params.region }}"
    bucket: "{{ $bucket_external_name }}"
    versioningConfiguration:
      - status: Enabled

#{{ end }}
#{{ end }}
```

</details>

## Work with schemas

Upbound Official Providers and some other packages include [JSON Schemas][json-schemas] for their resources. The `up` tooling generates a "meta-schema" that references all the individual schemas. Editors, via the YAML language server, consume these schemas and provide in-line documentation, linting, autocompletion, and other features when writing embedded Go templating functions.

### Make schemas available to a function

Use `up dependency add` to make schemas from a dependency available to a function. Dependencies are most often Crossplane providers, but they can also be configurations that include XRDs.

```console
up dependency add xpkg.upbound.io/upbound/provider-aws-s3:v1.20.0
```

Use `up project build` to make schemas available for XRDs defined by your project.

```console
up project build
```

### Use schemas in a Go templating file

The YAML language server reads a special comment at the top of the file to determine the file's schema. This comment indicates the location of the schema file built by `up` based on all the schemas available in the project:

```yaml
# yaml-language-server: $schema=../../.up/json/models/index.schema.json
```

All Upbound Official Providers include JSON Schemas.

When you build your project with `up project build`, the generated artifact contains the generated schemas for your XRDs. You can build a project and then import that project as a dependency for the resources you define. Your own project's schemas are also available when editing your functions as described above.

## Handle inputs and outputs

Functions require inputs and outputs to process requests and return values to your control plane.

:::tip
See the Crossplane [function-go-templating documentation][function-go-templating-documentation] for the full set of inputs, outputs, and other features supported by Go templating.
:::

### Inputs

Compositions execute in a pipeline of one or more sequential functions. A function updates desired resource state and returns it to Crossplane. Function requests and values rely on three pieces of information:

1. The observed state of the composite resource, and any composed resources.
2. The desired state of the composite resource, and any composed resources.
3. The function pipeline's context.

Each composition pipeline provides this information as *inputs* into the function.

Function inputs are available to Go templates in the following template inputs, which templates can access directly or with helper functions:

* **Observed state**: `.observed`
  * The `getCompositeResource` helper function fetches the observed composite resource.
  * The `getComposedResource` helper function looks up an observed composed resource.
* **Desired state**: `.desired`
* **Pipeline context**: `.context`

### Outputs

<!-- vale write-good.TooWordy = NO -->
To add resources to the pipeline's desired composed resources, define them in the template. Use the `gotemplating.fn.crossplane.io/composition-resource-name` annotation to define unique names for each resource. This allows you to update a resource rather than create a new one on subsequent functions runs. The `setResourceNameAnnotation` helper function sets this annotation:
<!-- vale write-good.TooWordy = YES -->

```yaml
# code: language=yaml
# yaml-language-server: $schema=../../.up/json/models/index.schema.json

---
apiVersion: s3.aws.upbound.io/v1beta1
kind: Bucket
metadata:
  annotations:
    {{ setResourceNameAnnotation "bucket" }}
spec:
  forProvider:
    region: "{{ $xr.spec.parameters.region }}"
```

To update the composite resource's status, have your templates output a resource of the composite's type *without* the `composition-resource-name` annotation:

```yaml
# code: language=yaml
# yaml-language-server: $schema=../../.up/json/models/index.schema.json

---
apiVersion: devexdemo.upbound.io/v1alpha1
kind: Bucket
status:
  someInformation: cool-status
```

:::tip
The `kind` here must match your XRD's `kind` exactly. This example assumes a
`v2` XRD (`apiextensions.crossplane.io/v2`) with `kind: Bucket`. If your XRD
uses the legacy `v1` API (`apiextensions.crossplane.io/v1`), your XRD's `kind`
uses an `X` prefix, for example `kind: XBucket`, so use that `kind` instead.
:::

To set conditions on the claim and composite, you can add a `ClaimConditions` resource to your templates:

```yaml
apiVersion: meta.gotemplating.fn.crossplane.io/v1alpha1
kind: ClaimConditions
conditions:
- type: BucketReady
  status: "True"
  reason: Ready
  message: Bucket is ready
  target: CompositeAndClaim
```

## See also

* [Go Templates Documentation][go-templates] - Official Go template documentation
* [function-go-templating Documentation][function-go-templating-documentation] - Complete function reference
* [JSON Schema][json-schemas] - Understanding schema validation



[go]: /manuals/cli/howtos/compositions/go
<!-- [go-templates]: /manuals/cli/projects/compositions/go-template -->
[kcl]: /manuals/cli/howtos/compositions/kcl
[python]: /manuals/cli/howtos/compositions/python
[go-templates]: https://pkg.go.dev/text/template
[function-go-templating]: https://github.com/crossplane-contrib/function-go-templating
[function-go-templating-documentation]: https://github.com/crossplane-contrib/function-go-templating?tab=readme-ov-file#function-go-templating
[s3-provider]: https://marketplace.upbound.io/providers/upbound/provider-aws-s3
[json-schemas]: https://json-schema.org/
