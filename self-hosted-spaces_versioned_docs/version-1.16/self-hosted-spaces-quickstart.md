---
title: Quickstart with Kind
sidebar_position: 1
description: Deploy a self-hosted Upbound Space on a local kind cluster
tier: "business"
---

Get started with Upbound Spaces using a local `kind` cluster. This guide walks you through deploying a self-hosted Space, creating your first control plane, and optionally connecting your Space to the Upbound Console.

:::info
Self-hosted Spaces are a business critical feature of Upbound and require a license token. [Contact Upbound](https://www.upbound.io/contact-us) if you want to try out self-hosted Spaces.
:::

## Prerequisites

- An Upbound organization account string, provided by your Upbound account representative
- A `token.json` license, provided by your Upbound account representative
- [`kind`](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) installed locally
- The [`up` CLI](../../../manuals/cli/overview/) v0.37.0 or newer

## Provision a kind cluster

Create a `kind` cluster with the required ingress configuration for Spaces:

```bash
cat <<EOF | kind create cluster --wait 5m --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 443
    hostPort: 443
    protocol: TCP
EOF
```

## Configure the pre-install

Set your Upbound organization account string as an environment variable:

```bash
export UPBOUND_ACCOUNT=<your-upbound-org>
```

Export the path to your license token file:

```bash
export SPACES_TOKEN_PATH="/path/to/token.json"
```

Set the Spaces version you want to install:

```bash
export SPACES_VERSION=<spaces-version>
```

## Install Spaces

Make sure your `kubectl` context is pointed at the `kind` cluster, then install the Spaces software:

```bash
up space init --organization="${UPBOUND_ACCOUNT}" \
  --token-file="${SPACES_TOKEN_PATH}" \
  "v${SPACES_VERSION}"
```

The `up` CLI automatically detects missing prerequisites and prompts you to install them.

## Connect to your Space

Point your kubeconfig context at the new Space:

```bash
up ctx disconnected/kind-kind
```

## Create your first control plane

Create a control plane in your Space:

```bash
up ctp create controlplane1
```

The first control plane takes around 5 minutes to reach a `READY` state. Check the status with:

```bash
up ctp list
```

## Connect to your control plane

With your kubeconfig still pointed at the Space cluster, connect to the control plane:

```bash
up ctx ./default/controlplane1
```

Verify the connection by listing CRDs on the control plane:

```bash
kubectl get crds
```

To disconnect and return to your previous context:

```bash
up ctx -
```

:::tip
Learn more about navigating Upbound with the [`up ctx` command reference](../../../manuals/cli/overview/).
:::

## Connect your Space to Upbound (optional)

You can connect your self-hosted Space to the Upbound Console for a unified operations and debugging experience.

### Prerequisites

- An existing Upbound account
- The `up` CLI installed and logged into your organization
- `kubectl` configured with the kubecontext of your Space cluster

### Enable the Query API

Connecting a Space requires the Query API to be enabled. Pass the following flags when running `up space init`:

```bash
up space init --token-file="${SPACES_TOKEN_PATH}" "v${SPACES_VERSION}" \
  --set "features.alpha.apollo.enabled=true" \
  --set "features.alpha.apollo.storage.postgres.create=true"
```

This creates a PostgreSQL cluster managed by [CloudNativePG](https://cloudnative-pg.io/). To use your own PostgreSQL instance instead, set `features.alpha.apollo.storage.postgres.create=false` and supply connection details at `features.alpha.apollo.storage.postgres.connection`.

### Connect the Space

Set a name for your self-hosted Space:

```bash
export UPBOUND_SPACE_NAME=your-self-hosted-space
```

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="cli" label="With up CLI" default>

Log into Upbound:

```bash
up login
```

Connect the Space to the Console:

```bash
up space connect "${UPBOUND_SPACE_NAME}"
```

This installs a Connect agent, creates a service account, and configures permissions in the `upbound-system` namespace of your Space.

  </TabItem>
  <TabItem value="helm" label="With Helm">

Export your Upbound org name (run `up org list` to find it):

```bash
export UPBOUND_ORG_NAME=your-org-name
```

Create a robot and export its token:

```bash
up robot create "${UPBOUND_SPACE_NAME}" --description="Robot used for connect agent"
export UPBOUND_TOKEN=$(up robot token create "${UPBOUND_SPACE_NAME}" "${UPBOUND_SPACE_NAME}-token" -ojson | jq -r .token)
```

Create a secret containing the robot token:

```bash
kubectl create secret -n upbound-system generic connect-token \
  --from-literal=token="${UPBOUND_TOKEN}"
```

Log into the Helm OCI registry using your license token:

```bash
jq -r .token $SPACES_TOKEN_PATH | helm registry login xpkg.upbound.io -u $(jq -r .accessId $SPACES_TOKEN_PATH) --password-stdin
```

Install the connect agent:

```bash
helm -n upbound-system upgrade --install agent \
  oci://xpkg.upbound.io/spaces-artifacts/agent \
  --version "0.0.0-1149.g40e2d83" \
  --set "global.space=${UPBOUND_SPACE_NAME}" \
  --set "global.organization=${UPBOUND_ORG_NAME}" \
  --set "global.tokenSecret=connect-token" \
  --set "image.repository=xpkg.upbound.io/spaces-artifacts/agent" \
  --set "registration.image.repository=xpkg.upbound.io/spaces-artifacts/register-init" \
  --set "registration.enabled=true" \
  --set "imagePullSecrets[0].name=upbound-pull-secret" \
  --set "billing.enabled=false" \
  --wait
```

  </TabItem>
</Tabs>

### View your Space in the Console

Go to the [Upbound Console](https://console.upbound.io), log in, and select your newly connected Space from the Space selector.

:::note
A self-hosted Space can only be connected to a single organization at a time.
:::
