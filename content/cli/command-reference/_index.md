---
title: "Up Command Reference"
weight: 110
geekdocCollapseSection: true
geekdocFileTreeSortBy: title
---

The `up` command-line provides a suite of tools to configure and interact with Upbound technologies.

## Flags
The following flags are available via `up -<flag>`.

| Short flag | Long flag   | Description                  |
|------------|-------------|------------------------------|
| `-h`       | `--help`    | Show context-sensitive help. |
|            | `--pretty`  | Pretty print output.         |
| `-q`       | `--quiet`   | Suppress all output.         |
| `-v`       | `--version` | Print version and exit.      |


## Commands
<!-- vale Upbound.Spelling = NO -->
<!-- Disable spelling rules for CLI commands -->
* [alpha]({{<ref "alpha" >}}) - Pre-release alpha features.
* [controlplane]({{<ref "controlplane" >}}) - Interact with Upbound managed control planes.
* [license]({{<ref "license">}}) - Information related to the licensing of the `up` command-line.
* [login]({{<ref "login">}}) - Authenticate to the Upbound Cloud Platform.
* [logout]({{<ref "logout">}}) - Logout of the Upbound Cloud Platform.
* [organization]({{<ref "organization" >}}) - Manage Upbound Cloud Platform organizations.
* [profile]({{<ref "profile" >}}) - Manage Upbound Cloud Platform profiles.
* [repository]({{<ref "repository" >}}) - Manage repositories hosted on the Upbound Cloud Platform.
* [robot]({{<ref "robot" >}}) - Manage Upbound Cloud Platform robot accounts.
* [uxp]({{<ref "uxp" >}}) - Install, upgrade or uninstall Upbound Universal Crossplane (`UXP`). 
<!-- vale Upbound.Spelling = Yes -->