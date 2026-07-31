---
title: Develop with AI
description: Connect AI coding assistants and AI operations to Upbound using MCP servers.
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Upbound provides Model Context Protocol (MCP) servers that give AI tools direct
access to Upbound resources. Use them to connect your AI coding assistant or
Kubernetes CLI to the Upbound Marketplace, or deploy them inside your control
plane to give AI operations access to cluster data at runtime.

<!-- vale Google.Headings = NO -->
## Marketplace MCP server
<!-- vale Google.Headings = YES -->

The marketplace MCP server lets your AI coding assistant search and explore the
[Upbound Marketplace][marketplace]. Use it to find packages, browse provider
repositories, and retrieve package metadata including CRDs and usage examples.

### Configure the Marketplace MCP server

The server requires UP CLI authentication. Log in before starting:

```shell
up login
```

<Tabs>
<TabItem value="http" label="HTTP (recommended)">

1. Start the marketplace MCP server:

   ```shell
   docker run --name mcp-marketplace --rm -d -p 8765:8765 \
     --platform linux/amd64 \
     -v "$HOME/.up:/mcp/.up:ro" \
     xpkg.upbound.io/upbound/marketplace-mcp-server-http:v0.1.0
   ```

2. Register the server with your MCP client:

<Tabs>
<TabItem value="claude-code" label="Claude Code">

```shell
claude mcp add --scope user --transport http marketplace http://localhost:8765/mcp
```

</TabItem>
<TabItem value="kubectl-ai" label="kubectl-ai">

:::info
kubectl-ai requires an
LLM API key and uses Gemini by default. Set `GEMINI_API_KEY` before running any
commands. kubectl-ai supports AI models from Gemini, VertexAi, AZOpenAI, OpenAI,
grok, Bedrock and local LLM providers such as ollama and llama.cpp. See the
[kubectl-ai docs][kubectl-ai] for more information on the other supported
providers. 
:::


Add the following to `~/.config/kubectl-ai/mcp.yaml`:

```yaml
servers:
  - name: marketplace
    url: http://localhost:8765/mcp
```

Then run kubectl-ai with MCP client mode enabled:

```shell
kubectl-ai --mcp-client "find providers for AWS S3"
```

</TabItem>
<TabItem value="json" label="JSON config">

```json
{
  "mcpServers": {
    "marketplace": {
      "transport": "http",
      "url": "http://localhost:8765/mcp"
    }
  }
}
```

</TabItem>
</Tabs>

3. Restart your AI tool to pick up the new server.

:::tip
Call the `reload_auth` tool in your AI session to refresh marketplace
credentials after running `up login` or switching profiles, without restarting
the server. 
:::

</TabItem>
<TabItem value="stdio" label="stdio">

Configure your MCP client to run the server via Docker directly.

<Tabs>
<TabItem value="claude-code" label="Claude Code">

```shell
claude mcp add --scope user marketplace -- \
  docker run --rm -i \
  -v "$HOME/.up:/mcp/.up:ro" \
  xpkg.upbound.io/upbound/marketplace-mcp-server:v0.1.0
```

</TabItem>
<TabItem value="kubectl-ai" label="kubectl-ai">

Add the following to `~/.config/kubectl-ai/mcp.yaml`, replacing `/home/your-username` with your home directory path:

```yaml
servers:
  - name: marketplace
    command: docker
    args:
      - run
      - --rm
      - -i
      - -v
      - /home/your-username/.up:/mcp/.up:ro
      - xpkg.upbound.io/upbound/marketplace-mcp-server:v0.1.0
```

Then run kubectl-ai with MCP client mode enabled:

```shell
kubectl-ai --mcp-client "find providers for AWS S3"
```

</TabItem>
<TabItem value="json" label="JSON config">

Replace `/home/your-username` with your home directory path:

```json
{
  "mcpServers": {
    "marketplace": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-v", "/home/your-username/.up:/mcp/.up:ro",
        "xpkg.upbound.io/upbound/marketplace-mcp-server:v0.1.0"
      ]
    }
  }
}
```

</TabItem>
</Tabs>

</TabItem>
</Tabs>

### Available tools

| Tool | Description |
|---|---|
| `search_packages` | Search the marketplace with filters for family, type, account, tier, and visibility |
| `get_package_metadata` | Retrieve metadata for a specific package |
| `get_package_assets` | Access documentation, icons, and release notes for a package |
| `get_repositories` | Browse organization repositories |
| `get_package_version_resources` | Get resources for a specific package version |
| `get_package_version_composition_resources` | Retrieve Crossplane composition resources |
| `get_package_version_groupkind_resources` | Access resources filtered by group and kind |
| `get_package_version_examples` | Get usage examples for package resources |
| `reload_auth` | Refresh UP CLI authentication without restarting the server |

## Control plane AI operations

<!-- vale write-good.Passive = NO -->
The control plane MCP server runs as a sidecar inside your control plane and
gives AI functions access to pod logs and events at runtime. The control plane
MCP is deployed as part of the
function pipeline that powers [intelligent control plane
operations][intelligentOps].
<!-- vale write-good.Passive = YES -->

### Configure the control plane MCP server

Before starting, make sure you have:

<!-- vale write-good.TooWordy = NO -->
- A Kubernetes cluster with Crossplane installed and `kubectl` configured to reach it
- Cluster-admin permissions or equivalent to create `ClusterRole`, `ClusterRoleBinding`, and `DeploymentRuntimeConfig` resources
- The `crossplane-system` namespace present on the cluster
<!-- vale write-good.TooWordy = YES -->

The control plane MCP server runs as a sidecar container alongside
`function-claude`. Configuring it requires RBAC permissions and a
`DeploymentRuntimeConfig` that injects the sidecar into the function's pod.

1. Create the RBAC resources. Save the following as `permissions.yaml`:

   ```yaml
   apiVersion: rbac.authorization.k8s.io/v1
   kind: ClusterRole
   metadata:
     name: log-and-event-reader
   rules:
   - apiGroups:
     - ""
     resources:
     - events
     - pods
     - pods/log
     verbs:
     - get
     - list
   ---
   apiVersion: rbac.authorization.k8s.io/v1
   kind: ClusterRoleBinding
   metadata:
     name: log-and-event-reader
   roleRef:
     apiGroup: rbac.authorization.k8s.io
     kind: ClusterRole
     name: log-and-event-reader
   subjects:
   - kind: ServiceAccount
     name: function-pod-analyzer
     namespace: crossplane-system
   ```

   Apply it to your cluster:

   ```shell
   kubectl apply -f permissions.yaml
   ```

2. Create a `DeploymentRuntimeConfig` that deploys the MCP server as a sidecar
   and points `function-claude` to it. Save the following as
   `deploymentruntimeconfig.yaml`:

   ```yaml
   apiVersion: pkg.crossplane.io/v1beta1
   kind: DeploymentRuntimeConfig
   metadata:
     name: ctp-mcp
   spec:
     serviceAccountTemplate:
       metadata:
         name: function-pod-analyzer
     deploymentTemplate:
       spec:
         selector: {}
         template:
           spec:
             containers:
             - name: package-runtime
               env:
               - name: MCP_SERVER_TOOL_CTP1_TRANSPORT
                 value: http-stream
               - name: MCP_SERVER_TOOL_CTP1_BASEURL
                 value: http://localhost:8080/mcp
             - name: controlplane-mcp-server
               image: xpkg.upbound.io/upbound/controlplane-mcp-server:{version}
   ```

   Apply it to your cluster:

   ```shell
   kubectl apply -f deploymentruntimeconfig.yaml
   ```

3. Reference the `DeploymentRuntimeConfig` in your `function-claude` `Function`
   resource:

   ```yaml
   apiVersion: pkg.crossplane.io/v1
   kind: Function
   metadata:
     name: upbound-function-claude
   spec:
     package: xpkg.upbound.io/upbound/function-claude:v0.2.0
     runtimeConfigRef:
       name: ctp-mcp
   ```

   `MCP_SERVER_TOOL_CTP1_BASEURL` tells `function-claude` where to reach the
   sidecar. The `ClusterRoleBinding` grants the `function-pod-analyzer` service
   account permission to read pod logs and events.

### Available tools

| Tool | Description |
|---|---|
| `get_pod_logs` | Retrieve container logs for a pod |
| `get_pod_events` | Retrieve events associated with a pod |


[marketplace]: https://marketplace.upbound.io
[intelligentOps]: /manuals/uxp/concepts/operations/intelligent-operations/
[kubectl-ai]: https://github.com/GoogleCloudPlatform/kubectl-ai
