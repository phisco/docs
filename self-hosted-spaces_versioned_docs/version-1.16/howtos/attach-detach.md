---
title: Connect or disconnect a Space
sidebar_position: 12
description: Enable and connect self-hosted Spaces to the Upbound console
---

:::important
This feature is in preview. You must
deploy and [enable the Query API][enable-the-query-api] and [enable Upbound
RBAC][enable-upbound-rbac] to connect a Space to Upbound.
:::

[Upbound][upbound] allows you to connect self-hosted Spaces and enables a streamlined operations and debugging experience in your Console.

## Usage

### Connect

Before you begin, make sure you have:

- An existing Upbound [organization][organization] in Upbound SaaS.
- The `up` CLI installed and logged into your organization
- `kubectl` installed with the kubecontext of your self-hosted Space cluster.
- A `token.json` license, provided by your Upbound account representative.
- You enabled the [Query API][query-api] in the self-hosted Space.

Create a new `UPBOUND_SPACE_NAME`. If you don't create a name, `up` automatically generates one for you:

```ini
export UPBOUND_SPACE_NAME=your-self-hosted-space
```

#### With up CLI

:::tip
The command tries to connect the Space to the org account context pointed at by your `up` CLI profile. Make sure you've logged into Upbound SaaS with `up login -a <org-account>` before trying to connect the Space.
:::

Connect the Space to the Console:

```bash
up space connect "${UPBOUND_SPACE_NAME}"
```

This command installs a Connect agent, creates a service account, and configures permissions in your Upbound cloud organization in the `upbound-system` namespace of your Space.

#### With Helm

Export your Upbound org account name to an environment variable called `UPBOUND_ORG_NAME`. You can see this value by running `up org list` after logging on to Upbound.

```ini
export UPBOUND_ORG_NAME=your-org-name
```

Create a new robot token and export it to an environment variable called `UPBOUND_TOKEN`:

```bash
up robot create "${UPBOUND_SPACE_NAME}" --description="Robot used for authenticating Space '${UPBOUND_SPACE_NAME}' with Upbound Connect"
export UPBOUND_TOKEN=$(up robot token create "$UPBOUND_SPACE_NAME" "$UPBOUND_SPACE_NAME" --file - | jq -r '.token')
```

:::note
Follow the [`jq` installation guide][jq-install] if your machine doesn't include
it by default.
:::

Create a secret containing the robot token:

```bash
kubectl create secret -n upbound-system generic connect-token --from-literal=token=${UPBOUND_TOKEN}
```

Specify your username and password for the helm OCI registry:

```bash
jq -r .token $SPACES_TOKEN_PATH | helm registry login xpkg.upbound.io -u $(jq -r .accessId $SPACES_TOKEN_PATH) --password-stdin
```

In the same cluster where you installed the Spaces software, install the Upbound connect agent with your token secret.

```bash
helm -n upbound-system upgrade --install agent \
  oci://xpkg.upbound.io/spaces-artifacts/agent \
  --version "0.0.0-1208.g54c1262" \
  --set "global.space=${UPBOUND_SPACE_NAME}" \
  --set "global.organization=${UPBOUND_ORG_NAME}" \
  --set "global.tokenSecret=connect-token" \
  --set "image.repository=xpkg.upbound.io/spaces-artifacts/agent" \
  --set "registration.image.repository=xpkg.upbound.io/spaces-artifacts/register-init" \
  --set "registration.enabled=true" \
  --set "imagePullSecrets[0].name=upbound-pull-secret" \
  --wait
```

#### Use an HTTP proxy

The Connect agent respects `HTTP_PROXY`, `HTTPS_PROXY`, and `NO_PROXY` for outbound traffic to Upbound. Set them on the agent with `extraEnv` and on the registration init container with `registration.extraEnv`. If you use Zscaler or a similar corporate forward proxy, use the same pattern for both as shown below.

| Variable | Description |
| --- | --- |
| `HTTP_PROXY` | HTTP proxy URL |
| `HTTPS_PROXY` | HTTPS proxy URL |
| `NO_PROXY` | Comma-separated hosts that bypass the proxy |

Example `agent-proxy-values.yaml`:

```yaml
extraEnv:
  - name: HTTP_PROXY
    value: "http://proxy.example.com:8080"
  - name: HTTPS_PROXY
    value: "http://proxy.example.com:8080"
  - name: NO_PROXY
    value: "10.0.0.0/8,.svc.cluster.local,localhost,127.0.0.1"
registration:
  extraEnv:
    - name: HTTP_PROXY
      value: "http://proxy.example.com:8080"
    - name: HTTPS_PROXY
      value: "http://proxy.example.com:8080"
    - name: NO_PROXY
      value: "10.0.0.0/8,.svc.cluster.local,localhost,127.0.0.1"
```

Install or upgrade using that file:

```bash
helm -n upbound-system upgrade --install agent \
  oci://xpkg.upbound.io/spaces-artifacts/agent \
  --version "0.0.0-1208.g54c1262" \
  --set "global.space=${UPBOUND_SPACE_NAME}" \
  --set "global.organization=${UPBOUND_ORG_NAME}" \
  --set "global.tokenSecret=connect-token" \
  --set "image.repository=xpkg.upbound.io/spaces-artifacts/agent" \
  --set "registration.image.repository=xpkg.upbound.io/spaces-artifacts/register-init" \
  --set "registration.enabled=true" \
  --set "imagePullSecrets[0].name=upbound-pull-secret" \
  -f agent-proxy-values.yaml \
  --wait
```

<!-- vale Google.Headings = NO -->
#### View your Space in the Console
<!-- vale Google.Headings = YES -->

Go to the [Upbound Console][upbound-console], log in, and choose the newly connected Space from the Space selector dropdown.

![A screenshot of the Upbound Console space selector dropdown](/img/attached-space.png)

:::note
You can only connect a self-hosted Space to a single organization at a time.
:::

### Disconnect

#### With up CLI

To disconnect a self-hosted Space or a deleted self-hosted Space, run the following command:

```bash
up space disconnect "${UPBOUND_SPACE_NAME}"
```

If the Space still exists, this command uninstalls the Connect agent and deletes the associated service account and permissions.

#### With Helm

To disconnect a self-hosted Space or a deleted self-hosted Space, run the following command:

```bash
helm delete -n upbound-system agent
```

Clean up the robot token you created for this self-hosted Space:

```bash
up robot delete "${UPBOUND_SPACE_NAME}" --force
```

## Security model

### Architecture

![An architectural diagram of a self-hosted Space attached to Upbound](/img/console-attach-architecture.jpg)

:::note
This diagram illustrates a self-hosted Space running in AWS connected to the global Upbound Console. The same model applies to a Space running in AKS, GKE, or other Kubernetes environments.
:::

### Data path

Upbound uses a Pub/Sub model over TLS to communicate between Upbound's global
console and your self-hosted Space. Self-hosted Spaces establishes a secure
connection with `connect.upbound.io`. `api.upbound.io`, and `auth.upbound.io` and subscribes to an
endpoint.

:::important
Add `connect.upbound.io`, `api.upbound.io`, and `auth.upbound.io` to your organization's list of
allowed endpoints.
:::

The
Upbound Console communicates to the Space through that endpoint. The data flow
is:

1. Users sign in to the Upbound Console, redirecting to authenticate with an organization's configured Identity Provider via SSO.
2. Once authenticated, actions in the Console, like listing control planes or specific resource types from a control plane. These requests post as messages to the Upbound Connect service.
3. A user's self-hosted Space polls the Upbound Connect service periodically for new messages, verifies the authenticity of the message, and fulfills the request contained.
4. A user's self-hosted Space returns the results of the request to the Upbound Connect service and the Console renders the results in the user's browser session.

**Upbound never stores data originated from a self-hosted Space.** The data is transient and only exposed in the user's browser session. The Console needs this data to render your resources and control planes in the UI.

### Data transmitted

Users interact with the Upbound Console to generate request queries to the Upbound Connect Service while exploring, managing, or debugging a self-hosted Space. These requests send data back to the user's browser session in the Console, including:

* Metadata for the Space
* Metadata for control planes in the state
* Configuration manifests for various resource types within your Space: Crossplane managed resources, composite resources, composite resource claims, Upbound shared secrets, Upbound shared backups, Crossplane providers, ProviderConfigs, Configurations, and Crossplane Composite Functions.

:::important
This data only concerns resource configuration. The data _inside_ the managed
resource in your Space isn't visible at any point.
:::

**Upbound can't see your data.** Upbound doesn't have access to session-based data rendered for your users in the Upbound Console. Upbound has no information about your self-hosted Space, other than that you've connected a self-hosted Space.

### Threat vectors

Only users with editor or administrative permissions can make changes using the Console like creating or deleting control planes or groups.


[enable-the-query-api]: /self-hosted-spaces/howtos/query-api
[enable-upbound-rbac]: /manuals/platform/rbac
[upbound]: /manuals/console/upbound-console
[organization]: /manuals/platform/organizations
[query-api]: /self-hosted-spaces/howtos/query-api
[jq-install]: https://jqlang.org/download/

[upbound-console]: https://console.upbound.io
