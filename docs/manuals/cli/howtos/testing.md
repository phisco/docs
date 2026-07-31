---
title: Run and Test Projects
sidebar_position: 8
description: How to run your control plane project on a development controlplane
---

import CrdDocViewer from '@site/src/components/CrdViewer';

Testing ensures your compositions and control planes work as expected, follow
best practices, and meet your organization's requirements. You can run your
projects in a development control plane and author tests to verify specific
capabilities in your project.

## Prerequisites

To test your compositions and run end-to-end tests, make sure you have:

* The `up` CLI `v0.38` or higher [installed][installed]
* An Upbound account
* Authenticated with Upbound using `up login`

## Development control planes

Development control planes are lightweight, temporary environments in Upbound
for testing your control plane projects. They provide simplified infrastructure 
with limited resources and a 24-hour lifespan. Development control planes allow
you to test APIs and compositions without the cost or complexity of
production environments.

:::info
Development Control Planes are available in Cloud Hosted Spaces only.
:::

### Render your composition

Preview how your composition creates resources with the `up composition render`
command before you deploy to a development control plane.

```shell
up composition render apis/xstoragebuckets/composition.yaml examples/xstoragebuckets/example-xr.yaml
```

This command requires a **Composite Resource** (XR) file that defines the
resources you want to create. The XR file contains the same parameters as your
example claim but explicitly defines the API type and target cluster.

Rendering locally validates your build, configuration and resource orchestration
render as expected before you deploy to a development control plane.

### Run your development control plane

To run your control plane projects on a development control plane, use the `up
project run` command.

```bash
up project run
```

The `up project run` command creates a development control plane in your Upbound
Cloud organization. The development control plane creates your project's custom
resources, compositions and functions in a limited scope isolated control plane.

<!-- vale Microsoft.Contractions = NO -->
:::warning
Development control planes are **not** suitable for production workloads
:::
<!-- vale Microsoft.Contractions = YES -->

You can validate your results in the Upbound Console and make changes to ensure
your project operates as expected before you move to production.

Upbound limits the number of concurrent development control planes you can
create based on your account tier. Review [Upbound's pricing][upbound-s-pricing] for more information.

## Test your project locally

You can also generate tests for your compositions locally with the `up test
generate` command.

### Generate a composition test

Composition tests validate the logic of your compositions without requiring a
live environment. They simulate the composition function pipeline, allowing
you to test resource creation, dependencies, and state transitions with mock
data.

You can generate tests with `up test generate` for composition tests.
You can write tests in KCL, Python, or Go.

For example, to generate a composition test:


<Tabs groupId="language">
<TabItem value="Go" label="Go">
```shell {copy-lines="all"}
up test generate my-test --language=go
```
</TabItem>

<TabItem value="Python" label="Python">
<!-- vale gitlab.SentenceSpacing = NO -->
```shell {copy-lines="all"}
up test generate my-test --language=python
```
</TabItem>

<TabItem value="KCL" label="KCL">
```shell {copy-lines="all"}
up test generate my-test --language=kcl
```
</TabItem>
</Tabs>

#### Author a composition test

Composition tests use a declarative API in KCL, Python, or Go. Each test
models a single function pipeline run, making testing more streamlined for
reading and debugging.

The test runner invokes your composition functions with a given XR input and
compares the composed resource output against `assertResources`. It doesn't
exercise the Crossplane composition controller, which handles reconciliation and
external resource management.


<Tabs groupId="language">
<TabItem value="Go" label="Go">

```go
// Package main generates a CompositionTest
package main

import (
	"fmt"
	"os"

	"k8s.io/utils/ptr"
	"sigs.k8s.io/yaml"

	metav1 "dev.upbound.io/models/io/k8s/meta/v1"
	metav1alpha1 "dev.upbound.io/models/io/upbound/dev/meta/v1alpha1"
)

func main() {
	assertResources := resourcesToItems[metav1alpha1.CompositionTestSpecAssertResourcesItem]()
	test := metav1alpha1.CompositionTest{
		APIVersion: ptr.To(metav1alpha1.CompositionTestAPIVersionmetaDevUpboundIoV1Alpha1),
		Kind:       ptr.To(metav1alpha1.CompositionTestKindCompositionTest),
		Metadata: &metav1.ObjectMeta{
			Name: ptr.To("test-xstoragebucket-default-go"),
		},
		Spec: &metav1alpha1.CompositionTestSpec{
			AssertResources: &assertResources,
			CompositionPath: ptr.To("apis/xstoragebuckets/composition.yaml"),
			XrPath:          ptr.To("examples/xstoragebuckets/example.yaml"),
			XrdPath:         ptr.To("apis/xstoragebuckets/definition.yaml"),
			TimeoutSeconds:  ptr.To(120),
			Validate:        ptr.To(false),
		},
	}
	output := map[string]interface{}{
		"items": []interface{}{test},
	}
	out, err := yaml.Marshal(output)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error encoding YAML: %v\n", err)
		os.Exit(1)
	}
	fmt.Print(string(out))
}
```

:::note
`up test generate` produces the complete `main.go`, including helper functions
`resourcesToItems`, `toItem`, and `convertViaJSON`. The snippet above shows only
`main()`. Do not copy it as a standalone file — run `up test generate` first,
then edit the generated file.
:::

Import your provider resource types from `dev.upbound.io/models` and pass them
as arguments to `resourcesToItems` to populate `assertResources`. The test
runner calls `go run .` and captures the YAML printed to stdout.

</TabItem>
<TabItem value="Python" label="Python">

```python
from .model.io.upbound.dev.meta.compositiontest import v1alpha1 as compositiontest
from .model.io.k8s.apimachinery.pkg.apis.meta import v1 as k8s

test = compositiontest.CompositionTest(
    metadata=k8s.ObjectMeta(
        name="test-xstoragebucket-default-python",
    ),
    spec = compositiontest.Spec(
        assertResources=[],
        compositionPath="apis/xstoragebuckets/composition.yaml",
        xrPath="examples/xstoragebuckets/example.yaml",
        xrdPath="apis/xstoragebuckets/definition.yaml",
        timeoutSeconds=120,
        validate=False,
    )
)
```
</TabItem>
<TabItem value="KCL" label="KCL">

```kcl
import models.io.upbound.dev.meta.v1alpha1 as metav1alpha1

_items = [
    metav1alpha1.CompositionTest{
        metadata.name="test-xstoragebucket-default-kcl"
        spec= {
            assertResources: []
            compositionPath: "apis/xstoragebuckets/composition.yaml"
            xrPath: "examples/xstoragebuckets/example.yaml"
            xrdPath: "apis/xstoragebuckets/definition.yaml"
            timeoutSeconds: 120
            validate: False
        }
    }
]
items = _items
```

</TabItem>
</Tabs>

#### Run a composition test

You can run your composition tests using the `up test run` command.

To run all tests, define the path and `*` to include
everything in that directory.
```shell
up test run tests/*
```

To run a specific test, give the path to that test directory:

```shell
up test run tests/my-test
```

For KCL tests you can also point to the specific file:

```shell
up test run tests/my-test/main.k
```

You can provide wildcards to run tests matching a pattern:

```shell
up test run tests/xstoragebucket/**
```

The command returns a summary of results:

```shell {copy-lines="none"}
up test run tests/*
...
 SUCCESS
 SUCCESS  Tests Summary:
 SUCCESS  ------------------
 SUCCESS  Total Tests Executed: 4
 SUCCESS  Passed tests:         4
 SUCCESS  Failed tests:         0
```

When you run composition tests, Upbound:

1. Detects the test language from the files present (`main.k`, `main.py`, or `go.mod`).
2. For Go tests, runs `go run .` locally and captures the YAML output.
3. Builds composition functions and pushes them to the local Docker daemon.
4. Sets the context to the local control plane.
5. Executes tests and validates results.

### Generate an end-to-end test

End-to-end tests validate compositions in real environments, ensuring creation,
deletion, and operations work as expected.

You can generate test with `up test generate` for end-to-end tests.
You can write tests in KCL, Python, or Go.

For example, to generate an end-to-end test:

<Tabs groupId="language">
<TabItem value="Go" label="Go">
```shell {copy-lines="all"}
up test generate my-e2e-test --e2e --language=go
```
</TabItem>

<TabItem value="Python" label="Python">

```shell {copy-lines="all"}
up test generate my-e2e-test --e2e --language=python
```

</TabItem>

<TabItem value="KCL" label="KCL">
```shell {copy-lines="all"}
up test generate my-e2e-test --e2e --language=kcl
```

</TabItem>
</Tabs>

#### Author an end-to-end test

End-to-end tests use the `E2ETest` API, written in KCL, Python, or Go.

<!-- vale gitlab.SentenceSpacing = YES -->
<Tabs groupId="language">

<TabItem value="Go" label="Go">

```go
// Package main generates an E2ETest
package main

import (
	"fmt"
	"os"

	"k8s.io/utils/ptr"
	"sigs.k8s.io/yaml"

	metav1 "dev.upbound.io/models/io/k8s/meta/v1"
	metav1alpha1 "dev.upbound.io/models/io/upbound/dev/meta/v1alpha1"
)

func main() {
	manifests := resourcesToItems[metav1alpha1.E2ETestSpecManifestsItem]()
	extraResources := resourcesToItems[metav1alpha1.E2ETestSpecExtraResourcesItem]()
	test := metav1alpha1.E2ETest{
		APIVersion: ptr.To(metav1alpha1.E2ETestAPIVersionmetaDevUpboundIoV1Alpha1),
		Kind:       ptr.To(metav1alpha1.E2ETestKindE2ETest),
		Metadata: &metav1.ObjectMeta{
			Name: ptr.To("e2etest-xstoragebucket-go"),
		},
		Spec: &metav1alpha1.E2ETestSpec{
			Crossplane: &metav1alpha1.E2ETestSpecCrossplane{
				AutoUpgrade: &metav1alpha1.E2ETestSpecCrossplaneAutoUpgrade{
					Channel: ptr.To(metav1alpha1.E2ETestSpecCrossplaneAutoUpgradeChannelRapid),
				},
			},
			DefaultConditions: &[]string{"Ready"},
			Manifests:         &manifests,
			ExtraResources:    &extraResources,
			SkipDelete:        ptr.To(false),
			TimeoutSeconds:    ptr.To(4500),
		},
	}
	output := map[string]interface{}{
		"items": []interface{}{test},
	}
	out, err := yaml.Marshal(output)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error encoding YAML: %v\n", err)
		os.Exit(1)
	}
	fmt.Print(string(out))
}
```

:::note
`up test generate` produces the complete `main.go` including helper functions.
The snippet above shows only `main()` — run `up test generate` first, then edit
the generated file.
:::

Populate `manifests` with your claim or XR resources and `extraResources` with
any prerequisites such as `ProviderConfig`. Import your resource types from
`dev.upbound.io/models` and pass them to `resourcesToItems`.

</TabItem>

<TabItem value="Python" label="Python">

```python
from .model.io.upbound.dev.meta.e2etest import v1alpha1 as e2etest
from .model.io.k8s.apimachinery.pkg.apis.meta import v1 as k8s
from .model.com.example.platform.xstoragebucket import v1alpha1 as xstoragebucket
from .model.io.upbound.aws.providerconfig import v1beta1 as providerconfig

bucket_manifest = xstoragebucket.XStorageBucket(
    metadata=k8s.ObjectMeta(
        name="uptest-bucket-xr",
    ),
    spec=xstoragebucket.Spec(
        parameters=xstoragebucket.Parameters(
            acl="private",
            region="eu-central-1",
            versioning=True,
        ),
    ),
)

provider_config = providerconfig.ProviderConfig(
    metadata=k8s.ObjectMeta(
        name="default",
    ),
    spec=providerconfig.Spec(
        credentials=providerconfig.Credentials(
            source="Upbound",
            upbound=providerconfig.Upbound(
                webIdentity=providerconfig.WebIdentity(
                    roleARN="arn:aws:iam::123456789:role/example-project-aws-uptest",
                ),
            ),
        ),
    ),
)

test = e2etest.E2ETest(
    metadata=k8s.ObjectMeta(
        name="e2etest-xstoragebucket-python",
    ),
    spec=e2etest.Spec(
        crossplane=e2etest.Crossplane(
            autoUpgrade=e2etest.AutoUpgrade(
                channel=e2etest.Channel.Rapid,
            ),
        ),
        defaultConditions=[
            "Ready",
        ],
        manifests=[bucket_manifest.model_dump()],
        extraResources=[provider_config.model_dump()],
        skipDelete=False,
        timeoutSeconds=4500,
    )
)
```
</TabItem>

<TabItem value="KCL" label="KCL">
```kcl
import models.com.example.platform.v1alpha1 as platformv1alpha1
import models.io.upbound.aws.v1beta1 as awsv1beta1
import models.io.upbound.dev.meta.v1alpha1 as metav1alpha1

_items = [
    metav1alpha1.E2ETest{
        metadata.name = "e2etest-xstoragebucket-kcl"
        spec = {
            crossplane.autoUpgrade.channel = "Rapid"
            defaultConditions = [
                "Ready"
            ]
            manifests = [
                platformv1alpha1.XStorageBucket{
                    metadata.name = "uptest-bucket-xr"
                    spec.parameters = {
                        acl = "private"
                        region = "eu-central-1"
                        versioning: True
                    }
                }
            ]
            extraResources = [
                awsv1beta1.ProviderConfig{
                    metadata.name = "default"
                    spec.credentials = {
                        source = "Upbound"
                        upbound.webIdentity = {
                            roleARN = "arn:aws:iam::123456789101:role/example-project-aws-uptest"
                        }
                    }
                }
            ]
            skipDelete = False
            timeoutSeconds = 4500
        }
    }
]
items = _items
```
</TabItem>
</Tabs>

#### Run an end-to-end test

You can run your end-to-end tests using the `up test run` command.

To run all tests, define the path and `*` to include
everything in that directory.
```shell
up test run --e2e tests/*
```

To run a specific test, give the path to that test directory:

```shell
up test run --e2e tests/my-e2e-test
```

You can provide wildcards to run tests matching a pattern:

```shell
up test run --e2e tests/xstoragebucket/**
```

The command returns a summary of results:

```shell {copy-lines="none"}
up test run --e2e tests/*
...
 SUCCESS
 SUCCESS  Tests Summary:
 SUCCESS  ------------------
 SUCCESS  Total Tests Executed: 4
 SUCCESS  Passed tests:         4
 SUCCESS  Failed tests:         0
```

When you run E2E tests, Upbound:

1. Detects the test language and converts to a unified format.
2. Builds and pushes the project.
3. Creates a development control plane with the specified Crossplane version.
4. Sets the context to the new control plane.
5. Applies extra resources in order and waits for their conditions.
6. Executes tests and validates results.
7. Exports resources for debugging on failure.
8. Cleans up the control plane when tests complete or the TTL expires.

<!-- vale write-good.TooWordy = YES -->

## Complex testing scenarios

For compositions requiring multiple controller loops (with one resource
depending on another, for example), create separate tests for each stage.

Mock states help test scenarios like:

1. Resources that already exist.
2. How your composition handles different resource states.
3. Conditional dependency chains between resources.


## Next steps
<!-- vale gitlab.SentenceLength = NO -->
Now that you know how to write tests for your control plane projects, the next
guide shows you how to [build and push your projects][build-and-push-your-projects].
<!-- vale gitlab.SentenceLength = YES -->

<!-- vale off -->

## Test API Explorer


### Composition Tests 

<CrdDocViewer crdUrl="/crds/testing/meta.dev.upbound.io_compositiontests.yaml" />

### End to End Tests

<CrdDocViewer crdUrl="/crds/testing/meta.dev.upbound.io_e2etests.yaml" />

### Project Tests

<CrdDocViewer crdUrl="/crds/testing/meta.dev.upbound.io_projects.yaml" />

### Operation Tests

<CrdDocViewer crdUrl="/crds/testing/meta.dev.upbound.io_operationtests.yaml" />


<!-- vale on -->

<!-- ignore "aggregate" -->
<!-- vale write-good.TooWordy = YES -->

[build-and-push-your-projects]: /manuals/cli/howtos/building-pushing
[installed]: /reference/cli-reference
[upbound-s-pricing]: https://www.upbound.io/pricing
