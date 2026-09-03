---
mdx:
  format: md
---

Run a composition locally to render an XR into composed resources.

The `render` command shows you what composed resources Crossplane would create
by printing them to stdout. It also prints any changes that would be made to the
status of the XR. It doesn't talk to Crossplane. Instead it runs the Composition
Function pipeline specified by the Composition locally, and uses that to render
the XR.

#### Examples

Simulate creating a new XR:

```shell
up composition render composition.yaml xr.yaml
```

Simulate updating an XR that already exists:

```shell
up composition render composition.yaml xr.yaml \
    --observed-resources=existing-observed-resources.yaml
```

Pass context values to the Function pipeline:

```shell
up composition render composition.yaml xr.yaml \
    --context-values=apiextensions.crossplane.io/environment='{"key": "value"}'
```

Pass extra resources requested by functions in the pipeline:

```shell
up composition render composition.yaml xr.yaml \
    --extra-resources=extra-resources.yaml
```

Pass credentials needed by functions in the pipeline:

```shell
up composition render composition.yaml xr.yaml \
    --function-credentials=credentials.yaml
```

Print each function container's stdout/stderr logs after rendering. Logs go
to stderr, so stdout remains valid YAML that can be piped to other tools:

```shell
up composition render composition.yaml xr.yaml --function-logs
```

Override function annotations for a remote Docker daemon.
```shell
DOCKER_HOST=tcp://192.168.1.100:2376 up composition render composition.yaml xr.yaml \
	--function-annotations render.crossplane.io/runtime-docker-publish-address=0.0.0.0 \
	--function-annotations render.crossplane.io/runtime-docker-target=192.168.1.100
```

#### Docker Configuration

The render command uses Docker (or any Docker-compatible container runtime) to
run composition functions. Configure the Docker connection using these standard
environment variables:

* `DOCKER_HOST`:        Docker daemon socket (e.g., `unix:///var/run/docker.sock`)
* `DOCKER_API_VERSION`: Docker API version to use
* `DOCKER_CERT_PATH`:   Path to Docker TLS certificates
* `DOCKER_TLS_VERIFY`:  Enable TLS verification (1 or 0)


#### Usage

`up composition render <composition> <composite-resource> [flags]`
#### Arguments

| Argument | Description |
| -------- | ----------- |
| `<composition>` | A YAML file specifying the Composition to use to render the Composite Resource (XR). |
| `<composite-resource>` | A YAML file specifying the Composite Resource (XR) to render. |
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
| `--xrd` | | A YAML file specifying the CompositeResourceDefinition (XRD) to validate the XR against. |
| `--context-files` | | Comma-separated context key-value pairs to pass to the Function pipeline. Values must be files containing JSON. |
| `--context-values` | | Comma-separated context key-value pairs to pass to the Function pipeline. Values must be JSON. Keys take precedence over --context-files. |
| `--include-function-results` | `-r` | Include informational and warning messages from Functions in the rendered output as resources of kind: Result. |
| `--include-full-xr` | `-x` | Include a direct copy of the input XR's spec and metadata fields in the rendered output. |
| `--observed-resources` | `-o` | A YAML file or directory of YAML files specifying the observed state of composed resources. |
| `--extra-resources` | `-e` | A YAML file or directory of YAML files specifying extra resources to pass to the Function pipeline. |
| `--include-context` | `-c` | Include the context in the rendered output as a resource of kind: Context. |
| `--function-credentials` | | A YAML file or directory of YAML files specifying credentials to use for Functions to render the XR. |
| `--function-annotations` | | Override function annotations for all functions. Can be repeated. |
| `--function-logs` | | Print stdout/stderr logs from Function containers to stderr after rendering. |
| `--timeout` | | How long to run before timing out. |
| `--max-concurrency` | | Maximum number of functions to build at once. |
| `--project-file` | `-f` | Path to project definition file. |
| `--cache-dir` | | Directory used for caching dependency images. |
| `--no-build-cache` | | Don't cache image layers while building. |
| `--build-cache-dir` | | Path to the build cache directory. |
