---
title: 6. Create an AI-augmented operation
description: "Use Upbound Crossplane to build and manage an AI-powered control plane"
---

<!-- vale gitlab.Uppercase = NO -->
Upbound Crossplane transforms infrastructure management by integrating
AI-powered pipelines directly into your control plane operations. 
LLM-enabled operations functions let you to build intelligent infrastructure 
platforms. These AI enhanced operations can automatically diagnose issues,
suggest fixes, and give contextual insights on resource health and
dependencies.
<!-- vale gitlab.Uppercase = YES-->

Operations allow you to build workflows using function pipelines that execute
tasks on resources under management by your control plane. Operations run once
to completion and then stop, making them ideal for event-driven automation
tasks.

<!-- vale gitlab.FutureTense = NO -->
In this tutorial, you'll learn how to create and configure AI-powered operations
using Upbound Crossplane to automatically detect common Kubernetes
pod issues. This tutorial is for platform engineers and DevOps
practitioners.
<!-- vale gitlab.FutureTense = YES -->

## Prerequisites

Before you begin, make sure you have:

* a defined project from the [project foundations][project-foundations] guide
* an Anthropic API key for Claude AI integration
* `kubectl` access to your Kubernetes cluster
* the [Upbound CLI][up] installed and configured

## Grant permissions to your control plane

To get started, make sure you have a running control plane with the necessary permissions.

Launch your control plane if it's not already running:

```shell
up project run --local
```
:::tip
The `project run` command builds and deploys any changes. If you don't have a
control plane running yet, it creates one, otherwise it targets your
existing control plane.
:::

Next, create a new file called `permissions.yaml`. Copy and paste the
configuration below to set up the required RBAC permissions for the AI
operations and save the file:

```yaml title="./permissions.yaml"
---
# log-and-event-reader provides sufficient yet narrow scoped permissions for
# reading pod logs and events related to the pod.
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: log-and-event-reader
rules:
# controlplane-mcp-server needs get/list on pods, pods/log, and events
# in order to retrieve information for analysis.
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
# Bind the above ClusterRole to the function's service account.
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
---
# analyses-collaborator provides sufficient yet narrow scoped permissions for
# reading and creating analyses.
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: analyses-collaborator
rules:
- apiGroups:
  - ops.upbound.io
  resources:
  - analyses
  verbs:
  - get
  - list
  - watch
  - create
---
# Bind the above ClusterRole to the function's service account.
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: analyses-collaborator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: analyses-collaborator
subjects:
- kind: ServiceAccount
  name: function-pod-analyzer
  namespace: crossplane-system
- kind: ServiceAccount
  name: function-analysis-gate
  namespace: crossplane-system
---
# crossplane needs permissions to manage Analyses for corresponding 
# WatchOperations.
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: crossplane:aggregate-to-crossplane:analysis-collaborator
  labels:
    rbac.crossplane.io/aggregate-to-crossplane: "true"
rules:
- apiGroups:
  - ops.upbound.io
  resources:
  - analyses
  verbs:
  - get
  - list
  - watch
  - patch
  - update
  - create
---
# remediation-collaborator provides sufficient yet narrow scoped permissions for
# reading remediations.
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: remediation-collaborator
rules:
- apiGroups:
  - ops.upbound.io
  resources:
  - remediations
  verbs:
  - get
  - list
  - watch
---
# Bind the above ClusterRole to the function's service account.
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: remediation-collaborator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: remediation-collaborator
subjects:
- kind: ServiceAccount
  name: function-remediation-gate
  namespace: crossplane-system
---
# crossplane needs permissions to watch Remediations for corresponding 
# WatchOperations.
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: crossplane:aggregate-to-crossplane:remediation-collaborator
  labels:
    rbac.crossplane.io/aggregate-to-crossplane: "true"
rules:
- apiGroups:
  - ops.upbound.io
  resources:
  - remediations
  verbs:
  - get
  - list
  - watch
---
# crossplane needs permissions to watch Remediations for corresponding 
# WatchOperations.
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: crossplane:aggregate-to-crossplane:event-watcher
  labels:
    rbac.crossplane.io/aggregate-to-crossplane: "true"
rules:
- apiGroups:
  - ""
  resources:
  - events
  verbs:
  - get
  - list
  - watch
```

Apply the permissions to your cluster:

```shell
kubectl apply -f ./permissions.yaml
```

<!-- vale Google.Headings = NO -->
## Configure Anthropic API access
<!-- vale Google.Headings = YES -->

Function-claude sends all requests to your Anthropic account and requires an API
key to work.

Create an [Anthropic API key][anthropic-key].

Create a new file called `claude.yaml` with your API key as a secret to your
control plane. Copy and paste the configuration below and replace `you-api-key`
with your actual Claude API key:

```yaml title="./claude.yaml"
apiVersion: v1
kind: Secret
metadata:
  name: claude
  namespace: crossplane-system
stringData:
  ANTHROPIC_API_KEY: "your-api-key"
```

Apply the secret to your cluster:

```shell
kubectl apply -f ./claude.yaml
```

<!-- vale Google.Headings = NO -->
## Enable _Analysis_ and _Remediation_ APIs
<!-- vale Google.Headings = YES -->

Upbound Crossplane uses Analysis and Remediation resource types to 
complement AI operations and enable human-in-the-loop intervention.

Enable these resource types on your cluster:

```shell
kubectl -n crossplane-system patch deployment upbound-controller-manager --type='json' -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--enable-analysis-and-remediation"}]'
```

## Add AI functions to your control plane project

Next, add the required functions and configure the AI-powered operations.

Add the necessary functions to your control plane project:

```shell
up dep add xpkg.upbound.io/upbound/function-claude:v0.2.0
up dep add xpkg.upbound.io/upbound/function-analysis-gate:v0.0.0-20250808233445-b3bb3dafbd25
up dep add xpkg.upbound.io/upbound/function-remediation-gate:v0.0.0-20250808233532-ad1d6ad2aea6
up dep add xpkg.upbound.io/upbound/function-event-filter:v0.0.0-20250808235120-d07a570f15d6
```

Generate the operation templates:

```shell
up operation generate remediate-oom
up operation generate analyze-events-for-pod-distress
```

Next, create a remediation operation by replacing the contents of
`./operations/remediate-oom/operation.yaml` with:

```yaml title="./operations/remediate-oom/operation.yaml"
apiVersion: ops.crossplane.io/v1alpha1
kind: WatchOperation
metadata:
  name: remediate-oom
spec:
  watch:
    apiVersion: ops.upbound.io/v1alpha1
    kind: Remediation
    namespace: default
  concurrencyPolicy: Forbid
  successfulHistoryLimit: 2
  failedHistoryLimit: 1
  operationTemplate:
    spec:
      mode: Pipeline
      pipeline:
      - step: can-attempt-remediation
        functionRef:
          name: upbound-function-remediation-gate
        input:
          apiVersion: gate.remediation.fn.upbound.io/v1alpha1
          kind: Input
```


Configure your analysis operation by replacing the contents of
`./operations/analyze-events-for-pod-distress/operation.yaml`
with:

```yaml title="./operations/analyze-events-for-pod-distress/operation.yaml"
apiVersion: ops.crossplane.io/v1alpha1
kind: WatchOperation
metadata:
  name: analyze-events-for-pod-distress
spec:
  watch:
    apiVersion: v1
    kind: Event
    namespace: default
  concurrencyPolicy: Forbid
  successfulHistoryLimit: 2
  failedHistoryLimit: 1
  operationTemplate:
    spec:
      mode: Pipeline
      pipeline:
      - step: filter-noisy-events
        functionRef:
          name: upbound-function-event-filter
        input:
          apiVersion: filter.event.fn.upbound.io/v1alpha1
          kind: Input
          type: Warning
          # We're specifically interested BackOff events.
          reason: BackOff
          # Let's make sure this is a repeated issue.
          count: 2
      - step: analysis-gate
        functionRef:
          name: upbound-function-analysis-gate
        input:
          apiVersion: gate.analysis.fn.upbound.io/v1alpha1
          kind: Input
      - step: analyze
        functionRef:
          name: upbound-function-claude
        input:
          apiVersion: claude.fn.upbound.io/v1alpha1
          kind: Prompt
          systemPrompt: |
            You are a Kubernetes infrastructure monitoring expert tasked with analyzing 
            pod logs and events to identify potential deployment issues.
            
            You will be provided with an event that includes an involvedObject that will
            include the namespace and name of the pod to examine.
          userPrompt: |
            You should use the tools available to you to look up events and logs related
            to the pod in order to identify what's wrong.

            REQUIRED OUTPUT FORMAT:
            { 
              "apiVersion": "ops.upbound.io/v1alpha1",
              "kind": "Analysis",
              "metadata": {
                "name": <the name of the pod>,
            	  "namespace": <the namespace of the pod>
              },
              "spec": {
                "involvedObjectRef: {
                  "kind": "Pod",
                  "apiVersion": "v1",
                  "namespace": <the namespace of the pod>,
                  "name": <the name of the pod>,
                  "uid": <the uid of the pod>
                },
                "analysis": "<The analysis of the issues with the pod.>",
                "remediations": [
                  {
                    "name": "<A name for the remediation that is unique to the remediations array. The name must be alphanumeric and must be no longer than 10 characters.>", 
                    "description": "< a short description for the remediation steps that will follow>",
                    "steps": [
                      {
                        "name": "<a unique name for the step>",
                		    "instruction": "<The instruction for this step>"
                      }
                    ]
                  }
                ]
              }
            }

            You can suggest multiple remediation strategies. Each array item in the 
            "remediations" array above will correspond to a strategy. Each strategy must 
            have a short description and a set of steps to fix the identified issue.

            Begin analysis now using the available tools.

            Event Spec:
            {{ .Resources }}
        credentials:
        - name: claude
          source: Secret
          secretRef:
            namespace: crossplane-system
            name: claude
```

Deploy the changes to your control plane:

```shell
up project run --local
```

Configure the function runtime permissions.

Save the following YAML as `./deploymentruntimeconfigs.yaml`:

```yaml title="./deploymentruntimeconfigs.yaml"
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
            args:
            - --debug
            env:
            - name: MCP_SERVER_TOOL_CTP1_TRANSPORT
              value: http-stream
            - name: MCP_SERVER_TOOL_CTP1_BASEURL
              value: http://localhost:8080/mcp
          - name: controlplane-mcp-server
            image: xpkg.upbound.io/upbound/controlplane-mcp-server:v0.0.0-19.g36b5527
            args:
            - --debug
---
apiVersion: pkg.crossplane.io/v1beta1
kind: DeploymentRuntimeConfig
metadata:
  name: analysis-perms
spec:
  serviceAccountTemplate:
    metadata:
      name: function-analysis-gate
  deploymentTemplate:
    spec:
      selector: {}
      template:
        spec:
          containers:
          - name: package-runtime
            args:
            - --debug
---
apiVersion: pkg.crossplane.io/v1beta1
kind: DeploymentRuntimeConfig
metadata:
  name: remediation-perms
spec:
  serviceAccountTemplate:
    metadata:
      name: function-remediation-gate
  deploymentTemplate:
    spec:
      selector: {}
      template:
        spec:
          containers:
          - name: package-runtime
            args:
            - --debug
---
apiVersion: pkg.crossplane.io/v1
kind: Function
metadata:
  name: upbound-function-claude
spec:
  package: xpkg.upbound.io/upbound/function-claude:v0.2.0
  runtimeConfigRef:
    name: ctp-mcp
---
apiVersion: pkg.crossplane.io/v1
kind: Function
metadata:
  name: upbound-function-analysis-gate
spec:
  package: xpkg.upbound.io/upbound/function-analysis-gate:v0.0.0-20250804021106-1692dfd80975
  runtimeConfigRef:
    name: analysis-perms
---
apiVersion: pkg.crossplane.io/v1
kind: Function
metadata:
  name: upbound-function-remediation-gate
spec:
  package: xpkg.upbound.io/upbound/function-remediation-gate:v0.0.0-20250803235634-0bc0b559a335
  runtimeConfigRef:
    name: remediation-perms
```

Apply the runtime configurations:

```shell
kubectl apply -f ./deploymentruntimeconfigs.yaml
```

These configurations associate the permissions you created earlier with the
functions deployed on your control plane to create and
interact with _Analysis_ and _Remediation_ resources.

## Test the AI-powered operation

<!-- vale gitlab.FutureTense = NO -->
<!-- vale Google.Will = NO -->
Now you'll deploy a problematic workload to trigger the AI analysis.

Deploy a WebApp built to trigger out-of-memory conditions.
<!-- vale Google.Will = YES -->
<!-- vale gitlab.FutureTense = YES -->

Save the following YAML as `./oomkilled.yaml`:

```yaml title="./oomkilled.yaml"
apiVersion: platform.example.com/v1alpha1
kind: WebApp
metadata:
  name: oomkilled
  namespace: default
spec:
  parameters:
    image: xpkg.upbound.io/upbound/pod-oom:v0.1.0
    port: 8080
    replicas: 1
    service:
      enabled: false
    ingress:
      enabled: false
    serviceAccount: default
    resources:
      limits:
        memory: 5Mi
        cpu: 100m
      requests:
        memory: 1Mi
        cpu: 100m
```

This image contains a workload that intentionally causes out-of-memory conditions.

Apply the problematic workload:

```shell
kubectl apply -f oomkilled.yaml
```

Verify the pod enters an `OOMKilled` state:

```shell
kubectl get pods
```

Monitor the AI analysis creation:

```shell
kubectl get analysis,remediation,remediationrequests,operations -A
```

<!-- vale Google.WordList = NO -->
:::note
The WatchOperation `./analyze-events-for-pod-distress` manifest above filters events down to:

```yaml title="./analyze-events-for-pod-distress"
apiVersion: filter.event.fn.upbound.io/v1alpha1
kind: Input
type: Warning
# We're specifically interested BackOff events.
reason: BackOff
# Let's make sure this is a repeated issue.
count: 2
```

It may take several `OOMKill` loops to create an Analysis.
:::
<!-- vale Google.WordList = YES -->

Examine the AI-generated analysis and remediation suggestions:

```shell
kubectl get analysis <analysis-name> -o yaml
```

Replace `<analysis-name>` with the actual name of the created _Analysis_
resource. The output shows Claude's analysis of the pod issues and suggested
remediation steps.

## Next steps

Now that your control plane is running locally with AI-powered operations,
explore additional [AI-powered operations][aiOperations] for other
infrastructure scenarios, or try out an [Intelligent Control Plane
solution][intelligentControlPlanes].

[up]: /manuals/cli/overview
[project-foundations]: /getstarted/builders-workshop/project-foundations
[anthropic-key]: https://docs.anthropic.com/en/api/admin-api/apikeys/get-api-key
[Configuration]: /manuals/uxp/concepts/packages/configurations
[aiOperations]: /manuals/uxp/concepts/operations/intelligent-operations/
[intelligentControlPlanes]: /guides/intelligent-control-planes/
