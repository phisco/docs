---
title: "Up CLI Release Notes"
description: "Release notes for the Up Cli"
toc_min_heading_level: 2
toc_max_heading_level: 2
---

<!--vale off -->

<!-- Release notes template/Copy&Paste
## vX.Y.Z

### Release Date: YYYY-MM-DD

#### Breaking Changes

:::important
Any important warnings or necessary information
:::

##### What's Changed

- User-facing changes

-->

## v0.54.0

### Release Date: 2026-09-03

##### What's Changed

- Added a new `up mirror` command group for offline and airgapped
  installations, with four subcommands:
  - `up mirror build-images` mirrors the images needed to build projects.
    Limit it to specific languages with `--language`, which defaults to all.
  - `up mirror package-images <package>` mirrors a Crossplane package along
    with its resolved transitive dependencies. Use `--concurrency` to control
    how many packages are mirrored at once.
  - `up mirror uxp-images -v <version>` mirrors the UXP Helm chart and every
    image a default install needs, then prints a Helm values overlay for
    installing from the mirror.
  - `up mirror space-images -v <version>` mirrors the images required for a
    given Upbound Spaces version.

  All four accept `--output-dir`/`-o`, `--destination-registry`/`-r`, and
  `--dry-run`.
- Deprecated `up space mirror` in favor of `up mirror space-images`. The old
  command still works, and still accepts `-t` for `--output-dir` and `-d` for
  `--destination-registry`, but it now prints a deprecation warning. Note that
  `up mirror space-images` uses `-o` and `-r` for those flags instead.
- Added `--function-logs` to `up composition render` and `up operation render`,
  which prints each function container's stdout and stderr to stderr after
  rendering. Standard output stays valid YAML that can be piped to other
  tools.
- Added `--function-logs` to `up test run`, which writes each test's rendered
  output and per-function logs to a timestamped directory under
  `_output/composition_test`, or `_output/operation_test` with `--operation`.
  Use the new `--output-dir` flag to change the base directory. Passing the
  global `--debug` flag also prints each test's rendered output to stderr
  after the run.
- Projects can now declare embedded functions explicitly with `spec.functions`
  in the project file. `Directory` sources build as before, and the new
  `Tarball` sources load pre-built per-architecture OCI image tarballs
  produced by external build systems. Setting the list disables function
  auto-discovery.
- Projects can now limit schema generation to specific languages with
  `spec.schemas.languages`. All project commands respect the setting, and `up
  function generate` refuses languages the project doesn't generate schemas
  for.
- `up project run` and `up test run --e2e` now honor the project's
  `spec.crossplane.version` when deriving the control plane version
  constraint, and accept an existing control plane whose Crossplane version
  satisfies that constraint instead of requiring an exact spec match. The
  control plane's auto-upgrade channel is no longer considered, mismatch errors
  now say which versions and fields differ, and `--skip-control-plane-check`
  skips this check as well.
- Improved Python project build times by pre-building the Python build image
  and preparing the build toolchain once per run rather than on every
  invocation.
- Updated the KCL base image to v0.12.3.
- Fixed a bug where `spec.operation` was required in the `OperationTest` CRD,
  and in the Python and KCL models generated from it, even though it's
  optional at runtime. This rejected the scaffold that `up test generate
  --operation` itself produces.
- Fixed handling of watched and required resources in operation tests. Inline
  `requiredResources` now reach the function pipeline, `watchedResourcePath`
  is respected, and an empty `watchedResource` no longer overwrites the
  required resources file.
- Fixed `up space billing export` failing with `invalid character '\x1f'
  looking for beginning of value` when storage objects are gzip-compressed but
  stored without a recognized gzip content type.
- Fixed `up test run --e2e` leaving a namespaced XR's composed resources
  behind during cleanup.
- Fixed `up project init` failing on Windows with a `path outside base dir`
  error when cloning a template.
- `up` now writes `~/.up/config.json` as indented JSON, so manual formatting
  of the file is no longer flattened on the next write.
- Fixed the `up project init` help text, which misspelled `--language` and
  referenced the wrong AWS template repository.

## v0.53.2

### Release Date: 2026-08-20

##### What's Changed

- Updated `up space mirror` to mirror the artifacts required for Spaces 1.18.
- Updated the default hub version to 1.0.0.

## v0.53.1

### Release Date: 2026-08-06

##### What's Changed

- Fixed a bug where the `-f` flag to project-related commands was not
  respected. For example, `up dependency add` would update `upbound.yaml` even
  when a different project file was specified.
- Improved media type detection in `up xpkg append`, so that the command works
  with registries that don't correctly set the `Content-type` header in their
  responses.

## v0.53.0

### Release Date: 2026-07-28

##### What's Changed

- The `up composition render` command now resolves transitive dependencies. It
  runs any functions that are transitively depended upon and provides required
  schemas from transitive provider dependencies.
- Fixed handling of OCI registries containing a port number in `up dependency
  add`.
- Fixed several bugs in Go code generation, particularly related to handling of
  `oneOf` and `anyOf` OpenAPI specifiers.
- Fixed a panic in `xpls` when dependencies are specified using the modern
  `apiVersion` and `kind` style.
- Updated `up controlplane migration import` to wait for CRDs to be established
  before applying CRs.

## v0.52.0

### Release Date: 2026-07-24

##### What's Changed

- Users can now configure patterns to ignore within a project with the
  `spec.ignore` field in `upbound.yaml`. Files and directories matching any of
  the ignored patterns will be ignored by `up project build`, `up test run`, and
  related commands, but will be available to function build processes during `up
  project build`. This allows users to ignore shared cache or library
  directories that reside under `functions/`.
- Added a new API dependency type, `crossplane`, enabling schema generation for
  core Crossplane and UXP resource types.
- Fix an issue where application of invalid init reosurces or extra resources
  during `up test run` and `up project run` would be retried
  indefinitely. Validation errors for such resources are now surfaced
  immediately and treated as permanent failures.

## v0.51.0

### Release Date: 2026-07-13

##### What's Changed

- Development control planes created by `up test run` and `up project run` can
  now be customized in the project file. Spaces dev control planes can have
  their labels, annotations, and spec overridden. Local dev control planes can
  have UXP helm chart values overridden.
- Updated the output of `up test run` to more clearly show test status and
  respect the `--format` flag.
- Made the timeout `up ctx` uses when fetching ingress details from a Spaces
  cluster configurable via the `UP_CTX_INGRESS_TIMEOUT` environment
  variable. The default is still 2 seconds, but the value can be customized to
  handle high latency environments.
- Fixed a bug where embedded Python functions were built only for the host
  architecture.

## v0.50.0

### Release Date: 2026-07-07

#### Breaking Changes

- The `up controlplane api-connector` command has been removed.
- An update to the package we use to handle OCI images has changed how we
  calculate package digests. Using `up project push` to push a project that was
  built with an older version of `up` will result in a package with broken
  dependencies. Push with an older version or rebuild with the current version
  to avoid this issue.

##### What's Changed

- Full Python projects are now supported for embedded functions and tests. `up
  function generate` and `up test generate` generate the new formats. `up
  project build` and `up test run` support both formats. This allows arbitrary
  dependencies to be used in Python functions and tests.
- Schemas are now generated locally for any dependency that does not have them
  packaged. This allows users to generate schemas for any provider.
- Fixed a bug that caused `up test run` to time out on certain systems.

## v0.49.1

### Release Date: 2026-06-19

##### What's Changed

- Fixed a bug where running `up composition render` without the `--xrd` flag
  produced an error.

## v0.49.0

### Release Date: 2026-06-12

##### What's Changed

- All commands that handle Git dependencies (e.g., `up dependency add`, `up
  project build`, `up composition render`) now support using an HTTP CONNECT
  proxy to tunnel SSH over HTTPS. See the `--git-proxy` flag.
- `up project run` now allows the default (wildcard) MRAP to be disabled by
  passing the `--no-default-mrap` flag.
- `up composition render` and `up test run` now invoke Crossplane's real
  composite reconciler via the `crossplane internal render` command.

## v0.48.3

### Release Date: 2026-05-22

##### What's Changed

- Image updates in `up space mirror`.

## v0.48.2

### Release Date: 2026-05-18

##### What's Changed

- Image updates in `up space mirror`.

## v0.48.1

### Release Date: 2026-05-08

##### What's Changed

- Bug fixes in `up space connect`.

## v0.48.0

### Release Date: 2026-05-05

##### What's Changed

- Added a `--tag` option to `up project run`, allowing a tag to be specified for
  the project build.
- Updated `up space mirror` to support UXP v2 and Spaces v1.17.
- Removed hard-coded container names from `up project ai configure-tools`.

## v0.47.0

### Release Date: 2026-04-13

##### What's Changed

- Added `up ctp` addon install command for control planes
- Added `up dep tree` and `up dep list` commands
- Support custom helm values for local dev and test control planes
- Support and preserve additional metadata in upbound.yaml

##### Bug Fixes

- Fixed re-generated v2 models as expected
- Fixed runtime and json imports handling in schema generation
- Fixed scale resources to be generic in Go schema generation


## v0.46.0

### Release Date: 2026-03-18

##### What's Changed

- Added input handling for XRD, composition for SimpleSchema and RGD, with tests in raw YAML

## v0.45.0

### Release Date: 2026-03-16

##### What's Changed

- Support bundle now includes control plane group namespaces by default
- Added support for UXP v2.2.0-up.3
- Updated Space mirror functionality for upbound spaces v1.16.0
- Aligned operation render and test behavior with upstream crossplane cli

##### Bug Fixes

- Fixed RBAC forbidden errors by retrying when the RBAC manager is slow.
- Fixed test diffs to strip `ownerReferences` from rendered resources.

## v0.44.3

### Release Date: 2026-01-27

##### What's Changed

- Fixed a signal handling bug in E2E tests that could cause the command to get
  stuck during cleanup.

## v0.44.2

### Release Date: 2026-01-13

##### What's Changed

- Added the `skipDelete` flag for E2E tests to allow test control planes to be
  inspected after a test failure.
- Fixed minor display issues in various interactive commands (e.g., `up project
  build`).

## v0.44.1

### Release Date: 2025-12-31

##### What's Changed

- Project `apiDependencies` of type `k8s` can now refer to a custom Kubernetes
  git repository (e.g., a private fork).

## v0.44.0

### Release Date: 2025-12-19

#### Breaking Changes

- `--dry-run` is no longer a global flag. All commands that previously respected
  `--dry-run` still accept it, so there is no behavioral change.

##### What's Changed

- Added `up resource count` to collect resource counts from a control plane.
- Made QR code generation in `up login` optional and disabled it by
  default. This fixes device code input in some terminals.
- Added `up support-bundle` for collecting and inspecting support bundles from
  control planes.
- Added support for `--init-resources` and `--extra-resources` in `up project
  run`. This allows pull secrets and other configuration to be created when
  running a project.
- Added support for private git repositories in project API dependencies.
- Overhauled our input and output system. Tables and spinners are prettier,
  interactive inputs are more reliable, and there should be fewer output
  glitches in general.

## v0.43.0

### Release Date: 2025-11-25

##### What's Changed

- Added new commands for `up space license`: apply, show, and remove
- Project `apiDependencies` can now be used for all Providers to generate language schemas
- Added support for Spaces 1.15

##### Bug Fixes

- Fixed an issue with Operation Tests when using Python Functions
- Fixed an issue when installing Upbound Spaces to pass basic auth credentials to OCI registries

### Breaking Changes
- Embedded Functions for Python need to update how they access resources from request - protobuf `.resource` fields with `struct_to_dict` from the SDK after updating to function-sdk-python [v0.9.0](https://github.com/crossplane/function-sdk-python/releases/tag/v0.9.0). See [reference PR](https://github.com/upbound/project-template-aws-s3/pull/13)

## v0.42.1

### Release Date: 2025-11-04

##### What's Changed

- Added support for Go and go-templating as test languages in `up project init`.

##### Bug Fixes

- Fixed issues in the go-templating test implementation that prevented it from
  executing templates correctly.

## v0.42.0

### Release Date: 2025-10-31

##### What's Changed

- Added support for building composition tests and e2e tests using Go and
  go-templating.
- Added support for remote Docker daemons in `up composition render` and `up
  test run`.
- Added support for Crossplane v2 in Spaces. `up project run` and `up test run`
  now use v2 control planes by default for running and testing v2alpha1
  projects.
- Added support for packaging `ManagedResourceActivationPolicy` resources in `up
  project build`.

##### Bug Fixes

- Fixed assorted filesystem issues on Windows.

## v0.41.0

### Release Date: 2025-09-10

#### Breaking Changes

- The `up alpha migration` commands have been removed. The stable version of
  these commands is available as `up controlplane migration`.
- Flag and environment variable defaults specified in the `base` field of a
  configuration profile are no longer respected.

#### What's Changed

- Test cleanup: when a test fails or is interrupted, `up test run --e2e` now
  cleans up resources created by test and prints a summary of any resources that
  could not be deleted.
- Added `up operation render` to allow manual testing of operations.
- Introduced operation tests to allow automated testing of operations.

##### Bug Fixes

- Fixed visual differentiation between selectable and unselectable items in the
  interactive mode of `up ctx`.
- Debian packages now contain binaries for the correct architecture.

## v0.40.3

### Release Date: 2025-08-21

- Telemetry improvements and bug fixes

## v0.40.2

### Release Date: 2025-08-19

- Telemetry improvements and bug fixes

## v0.40.1

### Release Date: 2025-08-13

##### Bug Fixes

- Migration: Fixed handling of ManagedResourceDefinitions,
  ManagedResourceActivationPolicies, and Licenses.
- Fixed a race condition in `up dependency add` and `up composition generate`
  that could result in transient failure to parse the project file.

## v0.40.0

### Release Date: 2025-08-12

##### What's Changed

- AI Integration: Added `up project ai configure-tools` command for AI-assisted configuration generation
- API Connector: Introduced `up api-connector` CLI for managing API connections
- UXP Management:
  - Added `up uxp license show`, `apply`, and management commands
  - Added `up uxp web-ui open`, `enable`, and `disable` commands for web UI management
  - Support for development licenses and license validation improvements
- Project:
  - Added `up project init` Improved project initialization with new wizard flow and templates
  - Added `up project run --local` command for local control planes
  - Added `up project stop` command for tearing down control planes
  - Added `up operation generate` for operation functions
  - Improved package readiness detection with RuntimeHealthy condition
  - Support for Upbound AddOns installation
- Authentication:
  - Added `up ctp oidc-auth aws` for OIDC authentication support
- Dependencies:
  - Enhanced `up dep add` to support controllers, addons and API dependencies
- Migration:
  - Promoted: `up ctp migration` migration commands out of alpha status
- Telemetry:
  - Integrated telemetry and tracing
- XRD Support:
  - Added support for Crossplane V2 XRDs
- Schema Generation:
  - Enhanced schema generators for Go, Python, KCL and Go-Templating
  - Support for Kubernetes Core resource schemas
  - Support for Crossplane Core resource schemas
- Testing:
  - Enhanced `up test` with initResources
  - Added `functionCredentialsPath` to composition test schema

##### Bug Fixes

- Fixed recursion errors when serializing Kubernetes objects with JSON fields
- Resolved panic in test scenarios when items are variables
- Fixed symlink handling for Windows
- Fixed issues with duplicate file paths in `up project run`
- Improved error handling and session expiry checks for logged-in users
- Fixed bugs in package readiness detection

##### Breaking Changes

- Projects v1alpha1 now require Crossplane >=v1.19
- Projects v1alpha2 now require Crossplane >=v2.0.0
- Context required for logout command
- Schemas: Python enum fields as literal
- xpls: Compositions using patch and transform are no longer supported

## v0.39.1

### Release Date: 2025-06-27

##### What's Changed

- `up xpkg append`: Added a `--single-image` option and support for converting image layers to an OCI image index (Crossplane Configurations).
- `up test`: Fixed a panic in Python test scenarios when items are passed as variables.
- `up test`: Resolved recursion errors when serializing Kubernetes objects with embedded JSON fields.
- `up test`: Added support for `initResources` in e2eTest definitions and improved error reporting by surfacing permanent errors.
- `up space mirror`: Updated mirror support for compatibility with Spaces 1.13.
- `up ctx`: Added support for custom CA bundles via a new `--ca-bundle` option, improving compatibility in proxy environments such as Zscaler.

## v0.39.0

### Release Date: 2025-04-25

##### What's Changed

- Added support for building functions using Go templating.
- Dependencies in private Marketplace repositories can now be fetched without
  the Upbound Docker credential helper configured.
- Added support for testing project changes using Control Plane Simulations.
- `up dep` commands now require fully-qualified package paths. This eliminates
  ambiguity and avoids using `docker.io` as the default registry.
- Added support for replacing the container images used as part of project
  builds, so project tools can be used without access to xpkg.upbound.io and
  images can be customized.
- Bug fixes and UX improvements.

## v0.38.4

### Release Date: 2025-03-21

##### What's Changed

- Fixed up render searching observed resources
- Robot tokens now supported for `up project`

## v0.38.3

### Release Date: 2025-03-18

#### What's Changed

- Stabalize E2E test suite

## v0.38.2

### Release Date: 2025-03-17

#### What's Changed

- Fixed `up test` and `up project run` compatibility with Crossplane 1.19.
- Added the ability to login with an Upbound Robot Token.
- Bug fixes and improvements in `up test` and `up project build`.

## v0.38.1

### Release Date: 2025-03-11

#### What's Changed

- Removed dependency on the `go` binary for generation of Go models.
- Updated name generation for array field types in Go models to avoid name
  collisions.
- Updated KCL function generation to avoid duplicate import names.
- Updated `go test` to pass through environment variables prefixed with `UP_` to
  tests written in KCL and Python.
- Fixed a panic in `up test` when a timeout was not specified.
- Improvements for `up migration` when mcp-connector is in use.

### Breaking Changes

- Some type names in the Go models have changed to avoid naming conflicts. Go
  functions using these fields will fail to compile during `up project build`
  and require an update.

## v0.38.0

### Release Date: 2025-03-04

#### What's Changed

- Go is now a supported language for embedded functions in projects.
- New `up test` commands introduced to allow for automated testing of
  compositions, including those that use embedded functions. Test cases can be
  written in YAML, Python, or KCL.
- Embedded KCL functions now use KCL v0.11.2.
- Commands that interact with private repositories in the Upbound Marketplace no
  longer require `docker-credential-up` to be configured.
- Bug fixes and UX improvements.

### Breaking Changes

- The short alias `-d` for the `--cache-dir` flag in various commands has been
  removed.

## v0.37.1

### Release Date: 2025-02-13

#### What's Changed

- Improve performance and silence unnecessary warning messages in `up
  composition render`.
- Ensure the `--project-file` flag works consistently across project commands.
- Minor bug fixes.

## v0.37.0

### Release Date: 2025-01-30

#### What's Changed

- New `up composition render` command introduced to allow for local testing of compositions including those that use embedded functions.
- Configuration is now profile-centric (see Breaking Changes below).
- `up profile use` restores the last-used Kubeconfig context for the selected profile.
- `up profile config` is deprecated and its functionality will be removed in a future release.
- Kubeconfig flags are handled consistently across commands.
- "Account" renamed to "Organization" in configuration and flags, since the value must be an Upbound organization name.
- Bug fixes and UX improvements.

### Breaking Changes

- Creating a configuration profile is now required.
- Users of disconnected Spaces must now create a disconnected configuration profile for each disconnected Space they interact with.
- `up ctx` is now profile-specific. Only contexts belonging to a given profile's organization or disconnected Space can be accessed when that profile is active.

## v0.36.4

### Release Date: January 10th, 2025.

#### What's Changed
- Updated base image for Python functions in projects.

## v0.36.3

### Release Date: January 7th, 2025.

#### What's Changed
- Starting with Spaces `v1.10.0`, `up space init` now supports ingress SSL
  passthrough during installation.
- Removed the unused clusterType field from Helm values in `up space init` for
  Spaces v1.10.0.

## v0.36.2

### Release Date: December 19th, 2024.

#### What's Changed
- Spaces Mirror: Fixed an issue affecting private registries when using registry flags introduced in v0.36.0.
- Added a new flag to the `up project run` command, enabling projects to be run in production control planes.

## v0.36.1

### Release Date: December 3rd, 2024.

#### What's Changed
- Resolved the `IsNotFound` error encountered in `up project run` for existing repositories.

## v0.36.0

### Release Date: November 28th, 2024.

#### What's Changed
- Enhanced the ingress cache to ensure concurrency safety for more stable and efficient operations.
- User organization is now validated during login, offering better security and a smoother user flow.
- Default values for `apiVersion` and `kind` have been added in Python schemas to streamline development.
- The `up dep update` command now processes updates in parallel, significantly reducing update times.
- Projects started in MCP now inherit the parent Space context, ensuring better alignment and continuity.
- `up space mirror` Added registry flags to provide more control and flexibility when managing mirrors.
- The embedded function KCL base image has been upgraded to v0.10.8.
- `up project run` Fixed issues with unsupported duplicate file paths to avoid potential conflicts.
- `up project run` Projects are now re-homed automatically, and repository visibility is preserved during project pushes.
- `up project run` Projects now load repositories into memory, improving performance and reducing disk I/O.
- `up project build` The Docker client environment can now be overridden with custom environment variables, offering more flexibility.
- `up ctp provider,function,configuration,pull-secret` Added support for installing functions and pull-secrets in CTP, expanding functionality and customization options.

## v0.35.3

### Release Date: November 6th, 2024.

#### What's Changed
- improvements for new commands introduced in v0.35.0

## v0.35.2

### Release Date: November 6th, 2024.

#### What's Changed
- improvements for new commands introduced in v0.35.0

## v0.35.1

### Release Date: November 6th, 2024.

#### What's Changed
- Made the ingress cache concurrency safe in `up ctx`.
- Prevented output of status fields for generated XRDs.
- Validated the user's organization during login.
- Configured projects to use the parent Space context when started in control plane.

## v0.35.0

### Release Date: November 6th, 2024.

#### What's Changed
#### Project Management Enhancements
- Introduced new commands:
  - `up project init`, `build`, `push`, `run`, and `move`
  - `up example generate`
  - `up xrd generate`
  - `up composition generate`
  - `up function generate`

https://docs.upbound.io/core-concepts/projects/

#### Dependency Management
- Enhanced the `xpkg dep` command to handle function dependencies and group dependencies effectively
- Added validation and examples for dependency handling

### Improvements
- Supported installation of mcp-connectors and cloudnative-pg from `xpkg.upbound.io`
- Improved error messages for unreachable spaces and unusable contexts in `up ctx`.

### Bug Fixes
- Fixed function name validation and schema handling errors.
- Improved dependency checks for projects and configurations.

### Breaking Changes
- Deprecated `xpkg` in favor of enhanced project workflows.

## v0.34.2

### Release Date: October 17th, 2024.

#### What's Changed
- Use spaces-config configmap to validate spaces in `up space attach`

## v0.34.1

### Release Date: October 10th, 2024.

#### What's Changed
- update `up alpha space mirror` corresponding images

## v0.34.0

### Release Date: October 7th, 2024.

#### What's Changed
- Reduced verbosity of logging
- Install agent from the `xpkg.upbound.io` registry
- Require username and password for agent chart installation.
- Added cloudnative-pg as a dependency and updated query to v1alpha2.
- Removed the "healthy" column from `up ctp get/list`.
- Ensured `up ctx` always uses the spaces ingress.

## v0.33.0

### Release Date: September 3rd, 2024.

#### What's Changed
- Update `up space init` update for 1.7.0 release OCI Registry change to `xpkg.upbound.io/spaces-artifacts`
- Update `up alpha space mirror` update for 1.7.0 release
- Update `up ctp connector` install using now OCI Registry `xpkg.upbound.io/spaces-artifacts`
- Improve `up ctp list/get` show healthy column and read message from status for CTP
- Improve `up alpha query` print right kind with multiple resources
- Improve `up xpkg dep` works now with functions
- Improve `up ctx` writing kubeconfig to stdout with current path
- Delete `up cofiguration`

## v0.32.0

### Release Date: August 2nd, 2024.

#### What's Changed

- New `up team` command for managing teams.
- New `up robot team` command for managing robot team membership.
- New `up repository permission` command for managing team access to repositories.
- `up space attach` and `up space detach` have been renamed to `up space connect` and `up space disconnect`, respectively.
- Improved `up alpha get` and `up alpha query` commands for querying resources in and across control planes.

## v0.31.0

### Release Date: June 7th, 2024.

:::note
- Web-based login (previously `up alpha web-login`) is now the default for `up login`. Use `up login --username=<user>` to invoke interactive terminal login.
- `up configuration` is now stubbed out, since Configurations are not currently supported in Upbound.
:::

#### What's Changed

- Web login is now the default for `up login`.
- `up ctx` now works with connected Spaces.
- `up ctx` now supports navigating between cloud, connected, and disconnected Spaces regardless of the current kubeconfig context.
- `up space attach` now works with Upbound IAM.

## v0.30.0

### Release Date: May 10th, 2024.

#### What's Changed

- We promoted `up web-login` to stable.
- We fixed several bugs related to `up ctx` failing to connect to a Space, group, or control plane.
- `up version` now prints information separated into client (your up CLI version) and server (version information for the control plane and Space you're connected to)
- `up space init` enables hub authz and authn by default.

## v0.29.0

### Release Date: May 3rd, 2024.

:::note
This release contains an important breaking change that affects how users gain access to the API server of their control planes.

For users who've deployed MCPs to Upbound prior to April 30th, 2024 (on our 'legacy GCP Space'), to connect to those MCPs you **must** use `up` ver `<= v0.28.0`.

To connect to an MCP in a Cloud Space or Connected/Disconnected Space, please use `up` ver >= `v0.29.0`.
:::

### Notable Changes

- We replaced `up ctp connect/disconnect` and `up ctp kubeconfig get` with a new `up ctx` command.
<!-- - We've overhauled how profiles work in `up`. Learn more about it by reading the [up CLI]({{<ref "/operate/cli">}}) reference. -->

#### What's Changed

- We introduced `up space list` to list all Cloud and Connected Spaces that exist in an organization's account.
- We added CRUD support for control plane groups with `up group` subcommand.
- We bumped the prerequisite version of UXP to `v1.15` when using `up space init` to create a single-tenant Space.
- We fixed some bugs that caused `up space detach` to fail.
- `up ctp list` now derives its context according to what's been set with `up ctx`.
- `up space init` now installs opentelemetry-operator as a prerequisite.
- All commands in `up` now use the new `up` profiles and kubecontexts.

## v0.28.0

### Release Date: April 2nd, 2024.

#### What's Changed

- We added `up alpha space attach` and `detach` commands to facilitate connecting a single-tenant Space to Upbound's global console.

## v0.27.0

### Release Date: March 27th, 2024.

#### What's Changed

- We fixed a bug that caused `up ctp connect` to fail to connect to a control plane running in a single-tenant Space.
- We fixed a bug impacting `up xpkg build` against Docker 1.25

## v0.26.0

### Release Date: March 16th, 2023.

#### What's Changed

- We added`up alpha query` and `up alpha get` commands.
- We changed `up trace`'s arguments to align with `up query` and `up get` and fixed up/down navigation.

## v0.25.0

### Release Date: March 12th, 2024.

### Notable Changes

- We updated `up version` to print client and server side versions.
- We improved the UX of `up ctp connect/disconnect`. Connect now gracefully handles different context names and allows repeated connect attempts.

#### What's Changed

- We fixed an issue in `up migration` that restored package statuses.
- `up migration` now uses the same confirmation dialog as `up space init`
- We improved the UX of `up ctp connect/disconnect`. Connect now gracefully handles different context names and allows repeated connect attempts.
- We unified the experience between `up ctp connect` and `up ctp kubeconfig get`.
- We added `alpha trace` and `alpha tview` template commands.
- We updated `up version` to print client and server side versions.

## v0.24.2

### Release Date: February 29th, 2024.

#### What's Changed

- This version includes some configuration tweaks for Crossplane and providers that is installed as prerequisites with the up space init command.

## v0.24.1

### Release Date: February 7th, 2024.

#### What's Changed

- We fixed an issue in `up migration` that restored package statuses.
- `up migration` now uses the same confirmation dialog as `up space init`

## v0.24.0

### Release Date: February 1st, 2024.

#### What's Changed

- We introduced `up alpha web-login`, a preview feature to allow web-based authentication to Upbound from `up`.

## v0.23.0

### Release Date: February 1st, 2024.

#### What's Changed

- Updated component prerequisite versions for an Upbound Space.
- We fixed an issue where `up migration` didn't wait for PackageRevisions to be healthy in order to complete a successful migration.
- Space subcommands now respect control plane groups.

## v0.22.1

### Release Date: January 30th, 2024.

#### What's Changed

- Updated component prerequisite versions for an Upbound Space.

## v0.22.0

### Release Date: January 30th, 2024.

### Notable Changes

- New `up alpha migration` commands to export state from a control plane and import it into an Upbound control plane.
- Allow creation of control planes without being configured to use Upbound's deployment service.

#### What's Changed

- Improved the help text to make `up profile set space` more discoverable.
- Allow creating new Upbound profiles with `type: space` by name.
- Fixed an issue where `up space init` ignored SIGINT.

## v0.21.0

### Release Date: October 12th, 2023.

### Notable Changes

- `up space init`'s UXP auto-installed prerequisite was updated from 1.12.2-up.2 to 1.13.2-up.2
- `up ctp connect` was re-introduced, with different functionality. Invoking the command will now connect your kubectl directly to the target control plane. Any kubectl commands run in that terminal will be executed against the target control plane.
- `up ctp disconnect` was introduced to compliment connect. Invoking the command will switch from the control plane context back to the originating context.
- `up ctp connector install` was extended to enable configuring mcp-connector against a Space's control plane.
- `up ctp connector uninstall` was introduced to compliment install. Invoking the command will delete the mcp-connector helm chart from the App Cluster.

#### What's Changed

- Re-introduce `up ctp connect` add `up ctp disconnect`
- Bump the UXP prereq for spaces to v1.13.2-up.2
- MCP Connector support for Spaces

## v0.20.0

### Release Date: October 10th, 2023.

### Notable Changes

- Introduced support for the following `up ctp` subcommands with spaces:
  - `create`
  - `delete`
  - `get`
  - `list`
- ⚠️ Breaking change ⚠️ `up ctp connect` was moved to up `ctp connector install`. This is anticipation of future work.

#### What's Changed

- Add tests for auth.yaml inclusion in provider package
- Allow pre-release versions of spaces to be installed and upgraded to
- Introduce support for up ctp (create, get, list, delete) against an Upbound Space
- Move ctp connect to ctp connector install

## v0.19.2

### Release Date: October 5th, 2023.

#### What's Changed

- Fix `up xpkg build` not including authentication extensions for Upbound console on Provider v1

## v0.19.1

### Release Date: August 29th, 2023.

#### What's Changed

- [Backport release-0.19] Fix `uxp install` error "couldn't find binding"

## v0.19.0

### Release Date: August 28th, 2023.

### Notable Changes

- New subcommands to support Upbound Spaces
- Add `up space billing get` with GCS support

#### What's Changed

- Add repeatable --debug (short -d) enabling API request logging
- Package composition function types
- Prevent deferred File.Close and wrap errors while putting CRDs into xpls provider package cache
- [DevEx] xpkg: add error contexts and print & fail on parse errors
- Add `up space billing get` with GCS support
- Add AWS support to `up spaces billing get`
- New subcommands to support Upbound Spaces
- Introduce additional requirements for the spaces install
- Adjust ingress-nginx deployment to target kind
- Spaces: add helpers for default and unattended installation
- Allow operators to override the registry and registry-endpoint for a spaces install
- Spaces: add support for public load balancer
- Add Azure support to `up space billing get` + provider-generic refactor
- cmd space: fix missing install.Context
- Space: improve destroy command
- space: unify and deduplicate registry flag logic
- Use concrete types with destroyCmd.Run()
- Fix typo in up space destroy output
- Rename `up space billing get` to export and fix event tags

## v0.18.0

### Release Date: June 27th, 2023.

#### What's Changed

- Make `help` more accessible
- Updates dependencies to get up close to current

## v0.17.0

### Release Date: May 12th, 2023.

#### What's Changed

- Added tab completion for two control plane commands
- Check the validity of kubeconfig before applying it
- xpkg batch subcommand to batch process provider packages

## v0.16.1

### Release Date: April 17th, 2023.

### Notable Changes

- This patch release for `v0.16.0` notably adds a contribution guide and fixes a marshaling bug when building bundled provider packages (if no controller image ref is passed).
- ⚠️ Breaking change ⚠️ With the core crossplane dependency bumped to `v1.6.0` , only `v1` API versions will be supported for `Composition` and `CompositeResourceDefinition` in the `apiextensions.crossplane.io` group. Support for `v1beta1` versions was removed. Please plan to update to `v1` and see the README for more details.

#### What's Changed

- add contribution guide that includes release process.
- Reorganize organization user commands.

## v0.16.0

### Release Date: March 28th, 2023.

### Notable Changes

- Introduction of many new commands to coincide with the relaunch of [Upbound](https://console.upbound.io), including many commands in `ctp` and `cfg`.
- ⚠️ Breaking change ⚠️ Starting in v0.16.0, `up controlplane create` must supply a required flag `--configuration-name` and no longer supports creating "empty canvas" control planes. Prior versions of up that do not have this flag will now get an error response from the Upbound API:`{"message":"configurationId is required"}`

#### What's Changed

- Add `ctp get` command, to show a single control plane.
- Added get commands for orgs, repos, robots, and robot tokens
- Implement JSON and YAML output formatting
- Add formatted ouput for more get & list commands
- Add alpha commands for MCP connector
- update up-sdk-go to use new error descriptions
- Initial suport for tab completions
- Introduce `configuration` commands
- Add completion predictors for control planes, profiles, repos, and robots
- Add completion predictor for configurations
- Add first iteration of `configuration create`
- Update login to fetch default user account if none specified
- Require configurations for creating control planes
- Separate kubeconfig generation steps
- Update gitsources login to pass port parameter.
- Add Organization user management
- Add support for listing configuration templates
- Disable the `upbound` subcommand.
- Revised the new "org user" comands to take an org name instead of an org ID
- Move `controlplane` commands to stable maturity level
- Create a token as part of connect command
- docs: add controlplane commands
- connect: fix the robot creation call
- Querying control planes with no associated configurations
- Update docs: add configuration, remove 'upbound'.
- Added --private flag for `up cfg create`
- connect: always create user token if not provided - no creation of robots
- connect: wait for helm installation to complete
- combine xpkg auth ext anno during build
- Move up ctp kubeconfig get to stable

## v0.15.0

### Release Date: November 6th, 2022.

#### What's Changed

- Support webhook configurations in provider packages

## v0.14.0

### Release Date: October 5th, 2022.

### Notable Changes

- Two new commands, `up ctp provider install` and `up ctp configuration install`, to quickly install Providers and Configurations into any control plane.
- The promotion of the experimental control planes (MCP) API to be the default for all `up alpha ctp` commands.
- ⚠️ Breaking change ⚠️ The promotion of the experimental MCP API may break some workflows, but all impacted commands fall under the `alpha` maturity group. Guarantees around backwards compatibility are explained in detail in the [API Maturity](https://github.com/upbound/up/blob/main/docs/maturity) documentation. While breaking changes will try to be minimized from version to version, `up` is not guaranteed to maintain backwards compatibility for pre-v1.0 versions.

#### What's Changed

- Use compact usage output
- Drop `UP_MCP_EXPERIMENTAL` in favor of new control planes API
- Add support for `up ctp provider install` and `up ctp configuration install`
- Move control plane commands to only support previously experimental API
- Clean up remaining mcp ID references in docs

## v0.13.0

### Release Date: August 26th, 2022.

[Release reference on GitHub](https://github.com/upbound/up/releases/tag/v0.13.0)

### Notable Changes

- drastically increases the functionality of up by introducing command groups for `organization`, `robot`, `repository`, and `profile`.
- restructures the up command graph by adding top-level "maturity" groups. Commands that are expected to change or evolve in the future are now nested under `up alpha`. See the [API Maturity](https://github.com/upbound/up/blob/main/docs/maturity) documentation for more information.

#### What's Changed

- Do not prompt for username / password if token is provided
- Only pass domain to docker-credential-up
- Embed Kubernetes client auth plugins
- Update comment about auth plugins
- Drop up uxp connect command
- Update MCP experimental ctp list with paging
- Move to pterm, emit success message for all operations, and support `--quiet` and `--pretty` global output config
- Add support for repository management and create on push
- Add Nix installation instructions
- Simplify `up upbound install` and add config command group
- Add support for organization management commands
- Support robot management commands
- Add `--force` option to destructive commands
- Move experimental and preview commands to `alpha` group
- Fix up logout and hint when session is missing
- Add support for `up ctp pull-secret create` and require token create output
- Cleanup command structure and allow creating new named profile on login
- Fix top-level alpha command help output and updates docs for v0.13.0 release
- Update configuration docs to include base config

<!-- vale on -->
