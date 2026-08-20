---
title: Control plane audit logging
---

This guide explains how to enable and configure audit logging for control planes
in Self-Hosted Upbound Spaces.

Starting in Spaces `v1.14.0`, each control plane contains an API server that
supports audit log collection. You can use audit logging to track creation,
updates, and deletions of Crossplane resources. Control plane audit logs
use observability features to collect audit logs with `SharedTelemetryConfig` and
send logs to an OpenTelemetry (`OTEL`) collector.


## Prerequisites

Before you begin, make sure you have:

* Spaces `v1.14.0` or greater
* Admin access to your Spaces host cluster
* `kubectl` configured to access the host cluster
* `helm` installed
* `yq` installed
* `up` CLI installed and logged in to your organization

## Enable observability

<!-- vale write-good.Passive = NO -->
Observability graduated to General Available in `v1.14.0` but is disabled by
default. 
<!-- vale write-good.Passive = YES -->

<Tabs>

<TabItem value="Alpha to GA">
### Before `v1.14`
To enable the GA Observability feature, upgrade your Spaces installation to `v1.14.0`
or later and update your installation setting to the new flag:

```diff
helm upgrade spaces upbound/spaces -n upbound-system \
-   --set "features.alpha.observability.enabled=true"
+   --set "observability.enabled=true"
```

</TabItem>
<TabItem value="GA">
### After `v1.14`

To enable the GA Observability feature for `v1.14.0` and later, pass the feature
flag:

```sh
helm upgrade spaces upbound/spaces -n upbound-system \
    --set "observability.enabled=true"

```
</TabItem>
</Tabs>

<!-- vale write-good.Passive = NO -->
To confirm Observability is enabled, run the `helm get values` command:
<!-- vale write-good.Passive = YES -->

```shell
helm get values --namespace upbound-system spaces | yq .observability
```

Your output should return:

```shell-noCopy
    enabled: true
```

## Install an observability backend

:::note
If you already have an observability backend in your environment, skip to the
next section.
:::
<!-- vale Upbound.Spelling = NO -->
<!-- vale gitlab.FutureTense = NO -->
For this guide, you'll use Grafana's `docker-otel-lgtm` bundle to validate audit log
generation. For production environments, configure a dedicated observability
backend like Datadog, Splunk, or an enterprise-grade Grafana stack.
<!-- vale gitlab.FutureTense = YES -->
<!-- vale Upbound.Spelling = YES -->

First, make sure your `kubectl` context points to your Spaces host cluster:

```shell
kubectl config current-context
```

The output should return your cluster name.

Next, install `docker-otel-lgtm` as a deployment using port-forwarding to
connect to Grafana. Create a manifest file and paste the
following configuration:

```yaml title="otel-lgtm.yaml"
apiVersion: v1
kind: Namespace
metadata:
  name: observability
---
apiVersion: v1
kind: Service
metadata:
  labels:
    app: otel-lgtm
  name: otel-lgtm
  namespace: observability
spec:
  ports:
    - name: grpc
      port: 4317
      protocol: TCP
      targetPort: 4317
    - name: http
      port: 4318
      protocol: TCP
      targetPort: 4318
    - name: grafana
      port: 3000
      protocol: TCP
      targetPort: 3000
  selector:
    app: otel-lgtm
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: otel-lgtm
  labels:
    app: otel-lgtm
  namespace: observability
spec:
  replicas: 1
  selector:
    matchLabels:
      app: otel-lgtm
  template:
    metadata:
      labels:
        app: otel-lgtm
    spec:
      containers:
        - name: otel-lgtm
          image: grafana/otel-lgtm
          ports:
            - containerPort: 4317
            - containerPort: 4318
            - containerPort: 3000
```

Next, apply the manifest:

```shell
kubectl apply --filename otel-lgtm.yaml
```

Your output should return the resources:

```shell
namespace/observability created
   service/otel-lgtm created
   deployment.apps/otel-lgtm created
```

To verify your resources deployed, use `kubectl get` to display resources with
an `ACTIVE` or `READY` status.

Next, forward the Grafana port:

```shell
kubectl port-forward svc/otel-lgtm --namespace observability 3000:3000
```

Now you can access the Grafana UI at http://localhost:3000.


## Create an audit-enabled control plane

To enable audit logging for a control plane, you need to label it so the
`SharedTelemetryConfig` can identify and apply audit settings. This section
creates a new control plane with the `audit-enabled: "true"` label. The
`audit-enabled: "true"` label marks this control plane for audit logging. The
`SharedTelemetryConfig` (created in the next section) finds control planes with
this label and enables audit logging on them. 

Create a new manifest file and paste the configuration below:

<div id="label">
```yaml title="ctp-audit.yaml"
apiVersion: v1
kind: Namespace
metadata:
  name: audit-test
---
apiVersion: spaces.upbound.io/v1beta1
kind: ControlPlane
metadata:
  labels:
    audit-enabled: "true"
  name: ctp1
  namespace: audit-test
spec:
  writeConnectionSecretToRef:
    name: kubeconfig-ctp1
    namespace: audit-test
```
</div>

The `metadata.labels` section contains the <Hover label="label" line="10">`audit-enabled` setting</Hover>.

Apply the manifest:

```shell
kubectl apply --filename ctp-audit.yaml
```

Confirm your control plane reaches the `READY` status:

```shell
kubectl get --filename ctp-audit.yaml
```

## Create a `SharedTelemetryConfig`

The `SharedTelemetryConfig` applies to all control plane objects in a namespace
and enables audit logging and routes logs to your `OTEL` endpoint.

Create a `SharedTelemetryConfig` manifest file and paste the configuration
below:

<div id="telemetryconfig">
```yaml title="sharedtelemetryconfig.yaml"
apiVersion: observability.spaces.upbound.io/v1alpha1
kind: SharedTelemetryConfig
metadata:
  name: apiserver-audit
  namespace: audit-test
spec:
  apiServer:
    audit:
      enabled: true
  exporters:
    otlphttp:
      endpoint: http://otel-lgtm.observability:4318
  exportPipeline:
    logs: [otlphttp]
  controlPlaneSelector:
    labelSelectors:
      - matchLabels:
          audit-enabled: "true"
```
</div>

This configuration:

* Sets <Hover label="telemetryconfig" line="9">`apiServer.audit.enabled` to `true`</Hover>
* Configures the <Hover label="telemetryconfig" line="12">`otlphttp` exporter to point to the `docker-otel-lgtm` service</Hover>
* Uses <Hover label="telemetryconfig" line="18">`controlPlaneSelector` to match any control plane in the namespace with the `audit-enabled` label set to `true`</Hover>

:::note
You can configure the `SharedTelemetryConfig` to select control planes in
several ways. For more information on control plane selection, see the [control
plane selection][ctp-selection] documentation.
:::

Apply the `SharedTelemetryConfig`:

```shell
kubectl apply --filename sharedtelemetryconfig.yaml
```

Confirm the configuration selected the control plane:

```shell
kubectl get --filename sharedtelemetryconfig.yaml
```

The output should return `SELECTED` as `1` and `VALIDATED` as `TRUE`.

For more detailed status information, use `kubectl get`:

```shell
kubectl get --filename sharedtelemetryconfig.yaml --output yaml | yq .status
```

## Generate and monitor audit events

You enabled telemetry on your new control plane and can now generate events to
test the audit logging. This guide uses the `nop-provider` to simulate resource
operations.

Switch your `up` context to the new control plane:

```shell
up ctx <ORG>/<SPACE>/<GROUP>/<CONTROL_PLANE>
```

Create a new Provider manifest:

```yaml title="provider-nop.yaml"
apiVersion: pkg.crossplane.io/v1
   kind: Provider
   metadata:
     name: crossplane-contrib-provider-nop
   spec:
     package: xpkg.upbound.io/crossplane-contrib/provider-nop:v0.4.0
```

Apply the provider manifest:

```shell
kubectl apply --filename provider-nop.yaml
```

Verify the provider installed and returns `HEALTHY` status as `TRUE`.

Apply an example resource to kick off event generation:


```shell
kubectl apply --filename https://raw.githubusercontent.com/crossplane-contrib/provider-nop/refs/heads/main/examples/nopresource.yaml
```
<!-- vale Upbound.Spelling = NO -->
In your Grafana dashboard, navigate to **Drilldown** > **Logs** under the
Grafana menu.
<!-- vale Upbound.Spelling = YES -->

Filter for `controlplane-audit` log messages.

Create a query to find `create` events on `nopresources` by filtering:

* The `verb` field for `create` events
* The `objectRef_resource` field to match the Kind `nopresources`

Review the audit log results. The log stream displays:

*The client applying the create operation
* The resource kind
* Client details
* The response code

Expand the example below for an audit log entry:

<details>
  <summary>Audit log entry</summary>

```json
{
     "level": "Metadata",
     "auditID": "51bbe609-14ad-4874-be78-1289c10d506a",
     "stage": "ResponseComplete",
     "requestURI": "/apis/nop.crossplane.io/v1alpha1/nopresources?fieldManager=kubectl-client-side-apply&fieldValidation=Strict",
     "verb": "create",
     "user": {
       "username": "kubernetes-admin",
       "groups": ["system:masters", "system:authenticated"]
     },
     "impersonatedUser": {
       "username": "upbound:spaces:host:masterclient",
       "groups": [
         "system:authenticated",
         "upbound:controlplane:admin",
         "upbound:spaces:host:system:masters"
       ]
     },
     "sourceIPs": ["10.244.0.135", "127.0.0.1"],
     "userAgent": "kubectl/v1.32.2 (darwin/arm64) kubernetes/67a30c0",
     "objectRef": {
       "resource": "nopresources",
       "name": "example",
       "apiGroup": "nop.crossplane.io",
       "apiVersion": "v1alpha1"
     },
     "responseStatus": { "metadata": {}, "code": 201 },
     "requestReceivedTimestamp": "2025-09-19T23:03:24.540067Z",
     "stageTimestamp": "2025-09-19T23:03:24.557583Z",
     "annotations": {
       "authorization.k8s.io/decision": "allow",
       "authorization.k8s.io/reason": "RBAC: allowed by ClusterRoleBinding \"controlplane-admin\" of ClusterRole \"controlplane-admin\" to Group \"upbound:controlplane:admin\""
     }
   }
```
</details>

## Customize the audit policy

Spaces `v1.14.0` includes a default audit policy. You can customize this policy
by creating a configuration file and passing the values to
`observability.collectors.apiServer.auditPolicy` in the helm values file.

An example custom audit policy:

```yaml
observability:
  controlPlanes:
    apiServer:
      auditPolicy: |
        apiVersion: audit.k8s.io/v1
        kind: Policy
        rules:
        # ============================================================================
        # RULE 1: Exclude health check and version endpoints
        # ============================================================================
        - level: None
          nonResourceURLs:
          - '/healthz*'
          - '/readyz*'
          - /version
        # ============================================================================
        # RULE 2: ConfigMaps - Write operations only
        # ============================================================================
        - level: Metadata
          resources:
          - group: ""
            resources:
            - configmaps
          verbs:
          - create
          - update
          - patch
          - delete
          omitStages:
          - RequestReceived
          - ResponseStarted
        # ============================================================================
        # RULE 3: Secrets - ALL operations
        # ============================================================================
        - level: Metadata
          resources:
          - group: ""
            resources:
            - secrets
          verbs:
          - get
          - list
          - watch
          - create
          - update
          - patch
          - delete
          omitStages:
          - RequestReceived
          - ResponseStarted
        # ============================================================================
        # RULE 4: Global exclusion of read-only operations
        # ============================================================================
        - level: None
          verbs:
          - get
          - list
          - watch
        # ==========================================================================
        # RULE 5: Exclude standard Kubernetes resources from write operation logging
        # ==========================================================================
        - level: None
          resources:
          - group: ""
          - group: "apps"
          - group: "networking.k8s.io"
          - group: "policy"
          - group: "rbac.authorization.k8s.io"
          - group: "storage.k8s.io"
          - group: "batch"
          - group: "autoscaling"
          - group: "metrics.k8s.io"
          - group: "node.k8s.io"
          - group: "scheduling.k8s.io"
          - group: "coordination.k8s.io"
          - group: "discovery.k8s.io"
          - group: "events.k8s.io"
          - group: "flowcontrol.apiserver.k8s.io"
          - group: "internal.apiserver.k8s.io"
          - group: "authentication.k8s.io"
          - group: "authorization.k8s.io"
          - group: "admissionregistration.k8s.io"
          verbs:
          - create
          - update
          - patch
          - delete
        # ============================================================================
        # RULE 6: Catch-all for ALL custom resources and any missed resources
        # ============================================================================
        - level: Metadata
          verbs:
          - create
          - update
          - patch
          - delete
          omitStages:
          - RequestReceived
          - ResponseStarted
        # ============================================================================
        # RULE 7: Final catch-all - exclude everything else
        # ============================================================================
        - level: None
          omitStages:
          - RequestReceived
          - ResponseStarted
```
You can apply this policy during Spaces installation or upgrade using the helm values file.

Audit policies use rules evaluated in order from top to bottom where the first
matching rule applies. Control plane audit policies follow Kubernetes conventions and use the
following logging levels:

* **None** - Don't log events matching this rule
* **Metadata** - Log request metadata (user, timestamp, resource, verb) but not request or response bodies
* **Request** - Log metadata and request body but not response body
* **RequestResponse** - Log metadata, request body, and response body

For more information, review the Kubernetes [Auditing] documentation.

## Disable audit logging

You can disable audit logging on a control plane by removing it from the
`SharedTelemetryConfig` selector or by deleting the `SharedTelemetryConfig`.

### Disable for specific control planes

Remove the `audit-enabled` label from control planes that should stop sending audit logs:

```bash
kubectl label controlplane <control-plane-name> --namespace <namespace> audit-enabled-
```

The `SharedTelemetryConfig` no longer selects this control plane, and audit log collection stops.

### Disable for all control planes

Delete the `SharedTelemetryConfig` to stop audit logging for all control planes it manages:

```bash
kubectl delete sharedtelemetryconfig <config-name> --namespace <namespace>
```

[ctp-selection]: /self-hosted-spaces/howtos/observability/#control-plane-selection
[Auditing]: https://kubernetes.io/docs/tasks/debug/debug-cluster/audit/
