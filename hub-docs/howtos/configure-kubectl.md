---
title: Configure kubectl for the hub
sidebar_position: 6
description: Configure a kubectl context that accesses the Upbound Platform hub.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Overview

This page configures a kubectl context named `hub` that talks to the Upbound
Platform hub. The hub serves a Kubernetes-style API, so once you configure
kubectl, standard commands like `get` and `describe` work with hub resources
like `controlplanes`, `spaces`, and `resources`.

## Prerequisites

- The hub's API URL, such as `https://<hub-host>`. If the hub isn't served with a
  publicly trusted certificate, you also need its CA certificate.
- An identity in an OIDC provider registered with the hub, for interactive login.
  For machine or CI environments, provide an IdP-issued JWT instead, covered
  under [Log in to the hub](#step-2-log-in-to-the-hub).
- [kubectl](https://kubernetes.io/releases/download/#kubectl) installed.

## Step 1: Install hub-credential-helper

`hub-credential-helper` is a CLI that authenticates you to the hub. It runs the
device-authorization and token-exchange flows to get a hub token, caches it, and
refreshes it as it expires.

Download the binary for your platform:

<Tabs>
<TabItem value="auto" label="Auto-detect">

```bash
os=$(uname -s | tr '[:upper:]' '[:lower:]')
arch=$(uname -m)
case "$arch" in
  x86_64) arch=amd64 ;;
  aarch64) arch=arm64 ;;
esac
curl -fsSLo hub-credential-helper \
  "https://storage.googleapis.com/upbound-hub-artifacts/main/current/bin/${os}_${arch}/hub-credential-helper"
chmod +x hub-credential-helper
sudo mv hub-credential-helper /usr/local/bin/
```

</TabItem>
<TabItem value="darwin-arm64" label="macOS (Apple Silicon)">

```bash
curl -fsSLo hub-credential-helper \
  "https://storage.googleapis.com/upbound-hub-artifacts/main/current/bin/darwin_arm64/hub-credential-helper"
chmod +x hub-credential-helper
sudo mv hub-credential-helper /usr/local/bin/
```

</TabItem>
<TabItem value="darwin-amd64" label="macOS (Intel)">

```bash
curl -fsSLo hub-credential-helper \
  "https://storage.googleapis.com/upbound-hub-artifacts/main/current/bin/darwin_amd64/hub-credential-helper"
chmod +x hub-credential-helper
sudo mv hub-credential-helper /usr/local/bin/
```

</TabItem>
<TabItem value="linux-amd64" label="Linux (x86_64)">

```bash
curl -fsSLo hub-credential-helper \
  "https://storage.googleapis.com/upbound-hub-artifacts/main/current/bin/linux_amd64/hub-credential-helper"
chmod +x hub-credential-helper
sudo mv hub-credential-helper /usr/local/bin/
```

</TabItem>
<TabItem value="linux-arm64" label="Linux (ARM64)">

```bash
curl -fsSLo hub-credential-helper \
  "https://storage.googleapis.com/upbound-hub-artifacts/main/current/bin/linux_arm64/hub-credential-helper"
chmod +x hub-credential-helper
sudo mv hub-credential-helper /usr/local/bin/
```

</TabItem>
</Tabs>

Verify the install:

```bash
hub-credential-helper --help
```

`hub-credential-helper --help` also documents the full flag set, environment
variables, and token-resolution order.

## Step 2: Log in to the hub

Set the hub URL used by the commands that follow:

```bash
HUB_URL=https://<hub-host>
```

Log in:

```bash
hub-credential-helper login --hub-url="$HUB_URL"
```

The helper prints a verification URL and code and opens your browser. Approve the
request there to sign in through the hub's identity provider. The helper then
caches a hub access token and a refresh token, so you don't log in again until the
refresh token expires.

:::note[CI and headless environments]
With no browser to complete the device flow, skip the interactive login. Write an
IdP-issued JWT (such as a mounted Kubernetes ServiceAccount token) to a file and
add `--token-file=/path/to/token` to the exec args when you create the kubectl
context in the next step. The helper exchanges it for a hub token.
:::

## Step 3: Add the hub context to your kubeconfig

Add a `hub` context that runs `hub-credential-helper` to fetch and refresh tokens,
so kubectl authenticates on its own.

The recommended commands merge the context into your existing kubeconfig. The
alternative writes a standalone kubeconfig file that you point `KUBECONFIG` at per
command.

<Tabs>
<TabItem value="kubectl" label="kubectl (recommended)">

Merge a `hub` context into your existing kubeconfig:

```bash
kubectl config set-cluster hub --server="$HUB_URL"

kubectl config set-credentials hub-user \
  --exec-api-version=client.authentication.k8s.io/v1 \
  --exec-command=hub-credential-helper \
  --exec-arg=exec-credential \
  --exec-arg=--hub-url="$HUB_URL" \
  --exec-interactive-mode=IfAvailable

kubectl config set-context hub --cluster=hub --user=hub-user
```

For a hub served with a private CA, include its certificate on the cluster:

```bash
kubectl config set-cluster hub --server="$HUB_URL" \
  --certificate-authority=/path/to/ca.crt --embed-certs=true
```

</TabItem>
<TabItem value="file" label="Write a kubeconfig file">

Write a standalone kubeconfig file for the hub context:

```bash
cat > hub.kubeconfig <<EOF
apiVersion: v1
kind: Config
clusters:
  - name: hub
    cluster:
      server: $HUB_URL
      # certificate-authority: /path/to/ca.crt  # uncomment if the hub uses a private CA
users:
  - name: hub-user
    user:
      exec:
        apiVersion: client.authentication.k8s.io/v1
        command: hub-credential-helper
        args:
          - exec-credential
          - --hub-url=$HUB_URL
        interactiveMode: IfAvailable
contexts:
  - name: hub
    context:
      cluster: hub
      user: hub-user
current-context: hub
EOF
```

Run kubectl against the hub by setting `KUBECONFIG` for the command:

```bash
KUBECONFIG=hub.kubeconfig kubectl get controlplanes
```

</TabItem>
</Tabs>

## Step 4: Verify the context

Confirm the context authenticates and reaches the hub.

`kubectl auth whoami` shows your username and groups as the hub sees them, which
confirms authentication works:

```bash
kubectl --context=hub auth whoami
```

A read such as `get controlplanes` confirms the context reaches the hub API:

```bash
kubectl --context=hub get controlplanes
```

## Troubleshooting

### The helper isn't found

kubectl runs `hub-credential-helper` as an exec plugin, so the binary must be on
your `PATH`:

```bash
command -v hub-credential-helper
```

If this prints nothing, reinstall the binary or move it onto your `PATH`.

### `auth whoami` fails

Check the identity the hub resolves for you:

```bash
kubectl --context=hub auth whoami
```

A failure points to the wrong hub URL (check `--hub-url` and the cluster
`server`) or an identity provider the hub doesn't recognize.

### Certificate errors reaching the hub

A hub served with a private CA needs its certificate in the cluster stanza.
Confirm you set `--certificate-authority` (or `certificate-authority` in the
kubeconfig file) to the correct path.

### Commands stop working after a while

Your cached tokens expired. Log in again:

```bash
hub-credential-helper login --hub-url="$HUB_URL"
```

## Next steps

- [Connect a control plane](connect-control-plane.md): Register a control plane
  and deploy a connector to observe its resources.
- [Connect a space](connect-space.md): Register a space and deploy a connector to
  observe its resources and control planes.
- [Query your fleet](../products/insights/resource-exploration/query.md): Search,
  filter, and count the resources the hub aggregates from your connected control
  planes.
- [RBAC and OIDC group mapping](rbac.md): Grant users and groups access across
  the hub.
