---
title: CLI Overview
sidebar_label: Overview
sidebar_position: 1
description: Install Crossplane, interact with the Upbound Marketplace and Managed
  Control Planes with the Upbound Up CLI.
---

import { versions } from "@site/src/components/Version.js"
import CodeBlock from '@theme/CodeBlock';

The Upbound `up` command-line enables interaction with Upbound control planes. It also simplifies common workflows with Upbound Crossplane (UXP) and building Crossplane packages for the Upbound Marketplace or any OCI-compliant registry.

<!-- vale Google.Headings = NO -->
## Install the Up command-line
<!-- vale Google.Headings = YES -->
Install the `up` command-line via shell, Homebrew or Linux package.

<Tabs>
<TabItem value="Shell" label="Shell">
Install the latest version of the `up` command-line via shell script by downloading the install script from [Upbound][upbound].

:::tip
Shell install is the preferred method for installing the `up` command-line.
:::

The shell install script automatically determines the operating system and platform architecture an installs the correct binary.

```shell
curl -sL "https://cli.upbound.io" | sh
```

:::note
Install a specific version of `up` by providing the version.
For example, to install version {versions.cli} use the following command:

<CodeBlock language="bash">
{`curl -sL "https://cli.upbound.io" | VERSION=v${versions.cli} sh`}
</CodeBlock>

Find the full list of versions in the <a href="https://cli.upbound.io/?prefix=stable/">Up command-line repository</a>.
:::

</TabItem>

<TabItem value="Windows" label="Windows">
Upbound provides a Windows executable.

<CodeBlock language="bash">
{`curl.exe -sLo up.exe "https://cli.upbound.io/stable/v${versions.cli}/bin/windows_amd64/up.exe"`}
</CodeBlock>

Find the full list of Windows versions in the [Up command-line
repository][win-versions].


</TabItem>

<TabItem value="Homebrew" label="Homebrew">
[Homebrew][homebrew] is a package manager for Linux and Mac OS.

Install the `up` command-line with a Homebrew `tap` using the command:

```shell
brew install upbound/tap/up
```
</TabItem>
<TabItem value="LinuxPackages" label="LinuxPackages">

Upbound provides both `.deb` and `.rpm` packages for Linux platforms.

Downloading packages requires both the [version][version] and CPU architecture (`linux_amd64`, `linux_arm`, `linux_arm64`).

### Debian package install

<CodeBlock language="bash">
{`curl -sLo up.deb "https://cli.upbound.io/stable/v${versions.cli}/deb/up_${versions.cli}_linux_\${ARCH}.deb"`}
</CodeBlock>

<!-- vale Microsoft.HeadingAcronyms = NO -->
### RPM package install

<CodeBlock language="bash">
{`curl -sLo up.rpm "https://cli.upbound.io/stable/v${versions.cli}/rpm/up_${versions.cli}_linux_\${ARCH}.rpm"`}
</CodeBlock>

</TabItem>
</Tabs>

## Install docker-credential-up

Install the `docker-credential-up` credential helper with the same methods supported for `up`.

<Tabs>
<TabItem value="Shell" label="Shell">

```shell
curl -sL "https://cli.upbound.io" | BIN=docker-credential-up sh
```

</TabItem>

<TabItem value="Homebrew" label="Homebrew">
```shell
brew install upbound/tap/docker-credential-up
```
</TabItem>
<TabItem value="LinuxPackages" label="LinuxPackages">

### Debian package install

<CodeBlock language="bash">
{`curl -sLo up.deb "https://cli.upbound.io/stable/v${versions.cli}/deb/docker-credential-up_${versions.cli}_linux_\${ARCH}.deb"`}
</CodeBlock>

<!-- vale Microsoft.HeadingAcronyms = NO -->
### RPM package install
<!-- vale Microsoft.HeadingAcronyms = YES -->
<CodeBlock language="bash">
{`curl -sLo up.rpm "https://cli.upbound.io/stable/v${versions.cli}/rpm/docker-credential-up_${versions.cli}_linux_\${ARCH}.rpm"`}
</CodeBlock>

</TabItem>
</Tabs>

[win-versions]: https://cli.upbound.io/_?prefix=stable/current/bin/windows_amd64/
[upbound]: https://cli.upbound.io
[homebrew]: https://brew.sh/
[version]: https://github.com/upbound/up/releases
