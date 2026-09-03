---
mdx:
  format: md
---

Run a project on a development control plane for testing.

The `run` command builds and runs a project on a development control plane for
testing.

This command:

- Builds all embedded functions defined in the project
- Creates or uses an existing development control plane
- Pushes packages to the container registry
- Installs the project configuration on the control plane
- Updates kubeconfig to use the development control plane

#### Development Control Planes

There are two kinds of development control planes:

1. Local development control planes, which run in a KIND cluster on the
   development machine.
2. Cloud development control planes, which run in Upbound Cloud Spaces.

Cloud development control planes are used by default when the current `up`
context is an Upbound Cloud Space. Use `up ctx` to update the current context.
Local development control planes are used by default otherwise, and can be
explicitly requested using the `--local` flag.

Local development control planes always use UXP v2.0 or newer, defaulting to the
latest version available. The default UXP version for cloud development control
planes depends on your project version: v1.x for v1alpha1 projects or v2.x for
v2alpha1 projects. The default version can be overridden with the
`--control-plane-version` flag.

It is also possible to run a project on an arbitrary UXP cluster referenced by
the current kubeconfig context by using the `--use-current-context` flag. Note
that this can be destructive, as it will create resources and install packages
in your cluster; it is not recommended to use `up project run` on shared or
production clusters.

#### Customizing the Development Control Plane

The optional `devControlPlane` section of the project file customizes the
development control plane created by `up project run`:

```yaml
apiVersion: meta.dev.upbound.io/v2alpha1
kind: Project
metadata:
  name: my-project
spec:
  repository: xpkg.upbound.io/example/my-project
  devControlPlane:
    spaces:
      metadata:
        labels:
          backup: "false"
        annotations:
          example.com/owner: alice
      spec:
        writeConnectionSecretToRef:
          name: kubeconfig-my-project
        crossplane:
          version: 1.20.1-up.1
          autoUpgrade:
            channel: None
    local:
      helmValues:
        args:
          - --debug
```

The `spaces` section applies only to cloud development control planes and is
ignored when a local development control plane is used. Its `metadata` section
sets additional labels and annotations on the `ControlPlane` object created in
the Space. Its `spec` section holds arbitrary `ControlPlane` spec fields that
are merged over the spec of the created `ControlPlane`; fields present in the
project file win. For example, `writeConnectionSecretToRef` specifies a secret
to which the control plane's connection details will be written, and
`crossplane.version` pins the Crossplane version. The control plane's name,
namespace, and metadata cannot be set via `spec`, and an explicit
`--control-plane-version` flag takes precedence over `spec.crossplane` from
the project file.

Labels and annotations can also be set for a single run with the repeatable
`--control-plane-label` and `--control-plane-annotation` flags, which override
values from the project file for the same key. Like the `spaces` section, these
flags apply only to cloud development control planes and are ignored when a
local development control plane is used:

```shell
up project run --control-plane-label backup=false --control-plane-annotation example.com/owner=alice
```

The `local.helmValues` section sets custom Crossplane helm chart values for
local development control planes, equivalent to passing them with the
`--helm-values` or `--set-helm-values` flags. Values given on the command line
take precedence over values from the project file.

The `devControlPlane` section and the flags above are applied only when the
control plane is created. To apply changes to an existing development control
plane, delete it and run `up project run` again.

#### Examples

Run the project using the default development control plane type (see above):

```shell
up project run
```

Run the project on a control plane with a specific name, using the default
type. The control plane will be created if it doesn't exist:

```shell
up project run --control-plane-name=my-dev-cp
```

Force a local development control plane to be used instead of a cloud
development control plane:

```shell
up project run --local
```

Create a local development control plane with an ingress controller enabled.
The Web UI will be accessible at localhost on a randomly assigned port:

```shell
up project run --local --ingress
```

Create a local development control plane with ingress mapped to specific port.
The Web UI will be accessible at http://127-0-0-1.nip.io:8080:

```shell
up project run --local --ingress --ingress-port=8080:80
```

Run a project using the current kubeconfig context:

```shell
up project run --use-current-context
```

Override the repository specified in the project file to push to a different
container registry. Note that when using a local development control plane
packages are side-loaded, avoiding the need to push:

```shell
up project run --repository=xpkg.upbound.io/example/my-project
```

Run on a Spaces control plane with a specific name, allowing a non-development
control plane to be used. This works with disconnected Spaces as well as Cloud
Spaces:

```shell
up project run --force --control-plane-name=my-cp
```

Override the default UXP version used for a Spaces development control plane,
for example to test a v1 project on a v2 control plane:

```shell
up project run --control-plane-version=v1.20.1-up.1
```

Apply `imageconfig.yaml` before installing the configuration and
`providerconfig.yaml` after installing the configuration:

```shell
up project run --init-resources=imageconfig.yaml --extra-resources=providerconfig.yaml
```

Run on a minimal local dev control plane without the default wildcard
`ManagedResourceActivationPolicy`. Useful when the project ships its own MRAPs
or when testing activation behavior:

```shell
up project run --local --no-default-mrap
```


#### Usage

`up project run [flags]`
#### Flags

| Flag | Short Form | Description |
| ---- | ---------- | ----------- |
| `--project-file` | `-f` | Path to project definition file. |
| `--repository` | | Repository for the built package. Overrides the repository specified in the project file. |
| `--no-build-cache` | | Don't cache image layers while building. |
| `--build-cache-dir` | | Path to the build cache directory. |
| `--max-concurrency` | | Maximum number of functions to build and push at once. |
| `--git-token` | | Token for git HTTPS authentication (GitHub PAT, GitLab token, etc.). |
| `--git-username` | | Username for git HTTPS authentication. Defaults to 'x-access-token'. Use your Bitbucket username for Bitbucket app passwords. |
| `--git-proxy` | | Proxy URL for git operations (e.g., http://proxy:8080). Supports HTTP CONNECT for SSH tunneling. |
| `--git-insecure-host-key` | | Skip SSH host key verification. Only use if you understand the MITM risks. |
| `--tag` | `-t` | Tag for the built package. If not provided, a tag of the form v0.0.0-{timestamp} will be generated. |
| `--control-plane-group` | | The control plane group that the control plane to use is contained in. This defaults to the group specified in the current context. |
| `--control-plane-name` | | Name of the control plane to use. It will be created if not found. Defaults to the project name. |
| `--control-plane-version` | | Version of Crossplane to use for the control plane. By default, the latest compatible version will be used. |
| `--control-plane-label` | | Labels to set on the development control plane when it is created in a Space, specified as key=value pairs. Overrides labels from the project file's devControlPlane section. |
| `--control-plane-annotation` | | Annotations to set on the development control plane when it is created in a Space, specified as key=value pairs. Overrides annotations from the project file's devControlPlane section. |
| `--skip-control-plane-check` | | Skip checks on the target control plane (development annotation and Crossplane version compatibility). |
| `--local` | | Use a local dev control plane, even if Spaces is available. |
| `--local-registry-path` | | Directory to use for local registry images. The default is system-dependent. |
| `--no-update-kubeconfig` | | Do not update kubeconfig to use the dev control plane as its current context. |
| `--use-current-context` | | Run the project with the current kubeconfig context rather than creating a new dev control plane. |
| `--cache-dir` | | Directory used for caching dependencies. |
| `--public` | | Create new repositories with public visibility. |
| `--timeout` | | Maximum time to wait for the project to become ready in the control plane. Set to zero to wait forever. |
| `--ingress` | | Enable ingress controller for the local dev control plane. |
| `--ingress-port` | | Port mapping for the local dev control plane (e.g., '8080:80'). If not specified, a random available port will be selected when ingress is enabled. |
| `--cluster-admin` | | Allow Crossplane cluster admin privileges in the local dev control plane. Defaults to true. |
| `--default-mrap` | | Install the default wildcard ManagedResourceActivationPolicy in the local dev control plane. Defaults to true. |
| `--init-resources` | | Paths to additional resource manifests that should be applied before installing the project. |
| `--extra-resources` | | Paths to additional resource manifests that should be applied after installing the project. |
| `--set-helm-values` | | Set custom Crossplane helm chart values for the local dev control plane, specified as key=value pairs. Overrides values from the project file's devControlPlane section. |
| `--helm-values` | | Path to a YAML file containing custom Crossplane helm chart values for the local dev control plane. Overrides values from the project file's devControlPlane section. |
