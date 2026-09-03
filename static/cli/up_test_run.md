---
mdx:
  format: md
---

Run project tests.

The `run` command executes project tests. By default, only composition tests are
executed; with the `--e2e` flag, only e2e tests are executed.

#### Examples

Run all composition tests located in the 'tests/' directory:

```shell
up test run tests/*
```

Override function annotations for a remote Docker daemon:
```shell
DOCKER_HOST=tcp://192.168.1.100:2376 up test run tests/*  \
	--function-annotations render.crossplane.io/runtime-docker-publish-address=0.0.0.0 \
	--function-annotations render.crossplane.io/runtime-docker-target=192.168.1.100
```


Run all end-to-end (e2e) tests located in the 'tests/' directory:

```shell
up test run tests/* --e2e
```

Run all operation tests located in the 'tests/' directory:

```shell
up test run tests/* --operation
```

Save each test's rendered output and function container logs for debugging.
Each run writes to a timestamped directory under `_output/composition_test/`
(or `_output/operation_test/` with `--operation`) in the project directory,
one subdirectory per test containing `render.log` and one `.log` file per
function. The exact path is printed at the end of the run. Use
`--output-dir` to change the base directory:

```shell
up test run tests/* --function-logs
up test run tests/* --operation --function-logs --output-dir=/tmp/test-logs
```

Additionally print each test's rendered output (and, with `--function-logs`,
the function container logs) to stderr after the run by passing the global
`--debug` flag:

```shell
up test run tests/* --function-logs --debug
```

Run e2e tests in `tests/` while specifying custom paths for the `kubectl`
binary:

```shell
up test run tests/* --e2e --kubectl=.tools/kubectl
```

Run e2e tests in `tests/`, overriding the default control plane version:

```shell
up test run tests/* --e2e --control-plane-version=v2.0.2-up.5
```

Skip cleanup after e2e test completion by setting `skipDelete: true` in the test
spec. This leaves the control plane and all test resources (including claims and
managed resources) intact for manual inspection and debugging:

```yaml
apiVersion: meta.dev.upbound.io/v1alpha1
kind: E2ETest
metadata:
  name: my-test
spec:
  skipDelete: true  # Skip all cleanup after test completion
  manifests:
    - apiVersion: example.com/v1
      kind: MyResource
      # ...
```

Note: The `--skip-control-plane-cleanup` flag is different - it keeps the
control plane running but still deletes test manifests (claims/XRs) after the
test completes. Use `skipDelete: true` in the test spec if you want to preserve
the test manifests as well.

#### Customizing Test Control Planes

E2e test control planes honor the `devControlPlane` section of the project
file: its `spaces.metadata` labels and annotations are applied to control
planes created in a Space, and its `local.helmValues` are used for local
development control planes with the lowest precedence (test spec `helmValues`
override them, and command-line helm value flags override both). The project
file's `spaces.spec` overrides are not applied to test control planes; for
example, each test creates its own control plane, so a shared
`writeConnectionSecretToRef` would make them all write to the same secret.


#### Usage

`up test run <patterns> ... [flags]`
#### Arguments

| Argument | Description |
| -------- | ----------- |
| `<patterns>` | The path to the test manifests |
#### Flags

| Flag | Short Form | Description |
| ---- | ---------- | ----------- |
| `--git-token` | | Token for git HTTPS authentication (GitHub PAT, GitLab token, etc.). |
| `--git-username` | | Username for git HTTPS authentication. Defaults to 'x-access-token'. Use your Bitbucket username for Bitbucket app passwords. |
| `--git-proxy` | | Proxy URL for git operations (e.g., http://proxy:8080). Supports HTTP CONNECT for SSH tunneling. |
| `--git-insecure-host-key` | | Skip SSH host key verification. Only use if you understand the MITM risks. |
| `--crossplane-version` | | Version of the Crossplane image to use for rendering. Defaults to the latest stable version. |
| `--crossplane-image` | | Override the full Crossplane Docker image reference for rendering. |
| `--crossplane-binary` | | Path to a local crossplane binary to use instead of Docker. |
| `--crossplane-docker-network` | | The docker network to start the crossplane container in |
| `--project-file` | `-f` | Path to project definition file. |
| `--repository` | | Repository for the built package. Overrides the repository specified in the project file. |
| `--no-build-cache` | | Don't cache image layers while building. |
| `--build-cache-dir` | | Path to the build cache directory. |
| `--max-concurrency` | | Maximum number of functions to build and push at once. |
| `--control-plane-group` | | The control plane group that the control plane to use is contained in. This defaults to the group specified in the current context. |
| `--control-plane-name-prefix` | | Prefix of the control plane name to use. It will be created if not found. |
| `--control-plane-version` | | Version of Crossplane to use for the control plane. By default, the latest compatible version will be used. |
| `--skip-control-plane-check` | | Skip checks on the target control plane (development annotation and Crossplane version compatibility). |
| `--local` | | Use a local dev control plane, even if Spaces is available. |
| `--cluster-admin` | | Allow Crossplane cluster admin privileges in the local dev control plane. Defaults to true. |
| `--local-registry-path` | | Directory to use for local registry images. The default is system-dependent. |
| `--skip-control-plane-cleanup` | | Skip cleanup of the control plane after the test run. |
| `--use-current-context` | | Run the project with the current kubeconfig context rather than creating a new dev control plane. |
| `--cache-dir` | | Directory used for caching dependencies. |
| `--function-annotations` | | Override function annotations for all functions (compositionTests and operationTests). Can be repeated. |
| `--function-logs` | | Write rendered output and Function container logs for each test to the output directory. Not supported with --e2e. |
| `--output-dir` | | Base directory for per-test render output and Function logs; each run writes to a timestamped subdirectory. Defaults to _output/composition_test or _output/operation_test in the project directory. |
| `--kubectl` | | Absolute path to the kubectl binary. Defaults to the one in $PATH. |
| `--public` | | Create new repositories with public visibility. |
| `--e2e` | | Run E2E tests |
| `--operation` | | Run Operation tests |
| `--set-helm-values` | | Set custom Crossplane helm chart values for the local test control plane, specified as key=value pairs. |
| `--helm-values` | | Path to a YAML file containing custom Crossplane helm chart values for the local test control plane. |
