---
title: Helm values
sidebar_label: Helm values
description: Configuration reference for the Hub Helm charts, generated from each chart's values.
sidebar_position: 3
---

The tables below list every configurable value in the Hub Helm charts, generated
from the charts themselves.

Hub installs through the umbrella **`hub`** chart, which pulls in the
**`hub-core`** and **`hub-connector`** subcharts. When configuring through the
umbrella, set a subchart value under its key, like `hub-core.api.replicaCount`
or `hub-connector.connector.replicaCount`. The `hub-webui` component is distributed
as a separate OCI chart and is not covered here.

## `hub` chart

Umbrella chart that deploys the full Hub stack — Hub Core, Hub Connector, and Hub WebUI.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| global.apiServiceName | string | `"hub-core"` | Name of the hub-core Service. Changing this one value rewires the connector and webui to the API automatically. |
| global.apiServicePort | int | `8080` | Port the hub-core Service listens on. |
| global.demo | object | (see fields below) | Install an opinionated, self-contained demo of the hub stack on the current Kubernetes cluster. When enabled, the chart also bundles PostgreSQL, Keycloak, and the Envoy Gateway controller, wires hub-core and hub-connector to them, and auto-registers the cluster as a default ControlPlane. The result is a complete stack that a prospect can browse without any external prerequisites.  Demo only - fixed credentials, ephemeral storage, self-signed TLS. Not suitable for production. For production, leave demo.enabled false and supply your own PostgreSQL connection, identity providers, and ControlPlanes via hub-core.bootstrap.files. See the user documentation for more details.  |
| global.demo.envoy | object | `{"nodePorts":{"https":30443,"postgres":30432},"serviceType":"NodePort"}` | Bundled Envoy Gateway data plane. NodePorts must match the host port mappings on the KIND cluster. |
| global.demo.keycloak.image | object | (see fields below) | Image used for the bundled demo Keycloak. |
| global.demo.keycloak.resources | object | `{"limits":{"cpu":"1000m","memory":"1Gi"},"requests":{"cpu":"100m","memory":"512Mi"}}` | Resource requests and limits for the Keycloak container. |
| global.demo.postgres.image | object | (see fields below) | Image used for the bundled demo PostgreSQL. |
| global.demo.postgres.resources | object | `{"limits":{"cpu":"500m","memory":"512Mi"},"requests":{"cpu":"50m","memory":"128Mi"}}` | Resource requests and limits for the Postgres container. |
| global.demo.postgres.tcpRoute | object | `{"enabled":true}` | Requires gateway.listeners.postgres.enabled. |
| global.gateway | object | (see fields below) | Kubernetes Gateway API integration. Subchart HTTPRoutes gate on enabled. Forcefully enabled by demo mode. |
| global.gateway.domain | string | `""` | Apex domain. &lt;subdomain&gt;.&lt;domain&gt; composes per-service hostnames. When demo.enabled, this defaults to 127.0.0.1.nip.io. |
| global.gateway.gatewayClassName | string | `""` | Required when create=true. Identifies the GatewayClass that the cluster's Gateway controller has registered (e.g. "envoy", "istio", "cilium"). |
| global.gateway.listeners.https.tls.certificateRefs | list | `[]` | Leave empty to offload TLS to the upstream (e.g. ACM on a cloud load balancer). Set refs to decrypt TLS inside the cluster. |
| global.gateway.namespace | string | `""` | Default = release namespace. |
| global.gateway.parentRef | object | `{"name":"hub-gateway","namespace":"","sectionName":""}` | Used when create=false. Charts target this parentRef. |
| global.gateway.subdomains | object | `{"api":"api","auth":"auth","db":"db","ui":"ui"}` | Subdomain prefixes per service. Each subchart can override these locally via its own httpRoute.subdomain. |
| global.hubCoreExternalUrl | string | `""` | Externally reachable base URL for hub-core. Used by hub-webui to redirect the browser through the OIDC login flow, and by hub-core to construct OIDC callback URIs.  Precedence: explicit value &gt; hub-core.api.externalURL &gt; gateway-derived (&lt;scheme&gt;://&lt;gateway.subdomains.api&gt;.&lt;gateway.domain&gt; when gateway integration is on). Empty for production installs without a gateway. |
| global.spaces | object | `{"enabled":false}` | Spaces integration. When enabled, the connector registers as a space instead of a control plane, and (in demo mode) hub-core bootstraps a Space for it to register against. |
| hub-connector.connector.fullnameOverride | string | `"hub-connector"` |  |
| hub-core | object | (see fields below) | PostgreSQL connection must be provided at install time. Either set connectionString or host + auth credentials. |

## `hub-core` chart

REST/Kubernetes-style API that stores and serves resources.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| api.affinity | object | `{}` |  |
| api.args | list | `[]` | Additional command line arguments |
| api.autoscaling | object | `{"enabled":false,"maxReplicas":100,"minReplicas":1,"targetCPUUtilizationPercentage":80}` | This section is for setting up autoscaling more information can be found here: https://kubernetes.io/docs/concepts/workloads/autoscaling/ |
| api.cors.allowedOrigins | list | `[]` | If empty, all origins are allowed |
| api.cors.enabled | bool | `false` | Auto-enabled (with the WebUI origin injected) when global.gateway.enabled, since the WebUI and API are routed to different subdomains. |
| api.externalURL | string | `""` | Externally reachable base URL used to construct the OIDC callback URI (e.g. https://api.example.com). Required when identity providers are configured; the callback will be:   &lt;externalURL&gt;/oidc/callback |
| api.extraEnv | list | `[]` | Additional environment variables |
| api.extraInitContainers | list | `[]` | Additional init containers |
| api.extraVolumeMounts | list | `[]` | Additional volume mounts for the main container |
| api.extraVolumes | list | `[]` | Additional volumes |
| api.featureFlags | object | (see fields below) | A built-in feature flag OFREP HTTP endpoint. When enabled, hub-core builds its flag definition in memory from the gates it ships (their defaults live in application code) and serves it over OFREP. Use gates below to override a gate's built-in default, and targetingOverlay to add rollout rules. |
| api.featureFlags.gates | object | `{}` | Feature gate overrides. Each gate ships a built-in default in application code; list a gate here only to override it, e.g. `Catalog: true`. Unknown or locked gates fail hub-core startup. Rendered to --feature-gates. |
| api.featureFlags.httpRoute | object | `{"enabled":false,"pathPrefix":"/ofrep"}` | Expose OFREP through the public HTTPRoute at /ofrep. Keep disabled by default; OFREP is intended for client-side flag evaluation only when explicitly exposed. |
| api.featureFlags.targetingOverlay | object | `{"configMapRef":{"key":"flags.json","name":""}}` | Optional targeting overlay: a ConfigMap holding a flagd flags.json that adds JSONLogic targeting rules or extra variants on top of the generated gate definition (for per-organization / per-control-plane rollout). It is hot-reloaded, so edits take effect without a pod restart. |
| api.frontendURL | string | `""` | Post-login redirect target (e.g. https://app.example.com). When empty and the Gateway integration is on, auto-derives from global.gateway.subdomains.ui + domain. When empty and gateway is off, hub-core redirects to "/" relative to the callback host. |
| api.fullnameOverride | string | `""` |  |
| api.hmacKey | object | (see fields below) | HMAC key used for session cookie signing (HMAC-SHA256). The Secret must hold a base64-encoded key of at least 32 raw bytes. This is NOT an ECDSA/JWK signing key - see signingKey below for that. |
| api.hmacKey.annotations | object | `{}` | Annotations to add to the generated Secret. Use this to configure CD-specific behavior (e.g. ArgoCD sync options, Flux drift detection). |
| api.hmacKey.existingPreviousSecretRef | object | `{"key":"HMAC_KEY_PREVIOUS","name":""}` | Optional reference for HMAC key rotation. May point at the same Secret as existingSecretRef with a different key, or a different Secret entirely. |
| api.hmacKey.existingSecretRef | object | `{"key":"HMAC_KEY","name":""}` | Reference to a pre-existing Secret holding the active HMAC key. When existingSecretRef.name is set, the chart will not generate one. |
| api.hmacKey.generate | bool | `true` | Generate a random 32-byte HMAC key on first install. Ignored when existingSecretRef.name is set. |
| api.hubInit | object | `{"image":{"digest":"","registry":"","repository":"hub-init","tag":""}}` | Image used by the init-signing-key and init-hmac-key init containers. Runs the hub-init binary; defaults to the chart registry and appVersion like the main api image. |
| api.hubInit.image.digest | string | `""` | Optional SHA256 digest pin. |
| api.hubInit.image.registry | string | `""` | Overrides the chart-wide registry for this image. |
| api.hubInit.image.tag | string | `""` | Overrides the image tag whose default is the chart appVersion. |
| api.image.digest | string | `""` | Optional SHA256 digest pin. |
| api.image.pullPolicy | string | `"IfNotPresent"` |  |
| api.image.registry | string | `""` | Overrides the chart-wide registry for this workload. |
| api.image.repository | string | `"hub-core"` |  |
| api.image.tag | string | `""` | Overrides the image tag whose default is the chart appVersion. |
| api.initDb | object | (see fields below) | Image used by the init-db init container to wait for PostgreSQL. |
| api.livenessProbe.failureThreshold | int | `3` |  |
| api.livenessProbe.httpGet.path | string | `"/livez"` |  |
| api.livenessProbe.httpGet.port | string | `"http"` |  |
| api.livenessProbe.initialDelaySeconds | int | `0` |  |
| api.livenessProbe.periodSeconds | int | `10` |  |
| api.livenessProbe.successThreshold | int | `1` |  |
| api.livenessProbe.timeoutSeconds | int | `1` |  |
| api.migration | object | `{"extraInitContainers":[],"extraVolumeMounts":[],"extraVolumes":[],"serviceAccount":{"annotations":{},"automount":true,"create":true,"name":""}}` | Dedicated ServiceAccount for the DB migration Job. |
| api.migration.extraInitContainers | list | `[]` | Additional init containers to attach to the migration Job pod. |
| api.migration.extraVolumeMounts | list | `[]` | Additional volume mounts on the sql-migrate container. |
| api.migration.extraVolumes | list | `[]` | Additional volumes attached to the migration Job pod. |
| api.migration.serviceAccount.name | string | `""` | Override the generated SA name. When create is false this MUST be set to an SA that exists in the release namespace before install. |
| api.nameOverride | string | `""` |  |
| api.nodeSelector | object | `{}` |  |
| api.pdb | object | `{"create":false,"maxUnavailable":1,"minAvailable":""}` | PodDisruptionBudget. Off by default; turn on when replicaCount &gt; 1 or autoscaling is enabled. |
| api.podAnnotations | object | `{}` | This is for setting Kubernetes Annotations to a Pod. For more information checkout: https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/ |
| api.podLabels | object | `{}` | This is for setting Kubernetes Labels to a Pod. For more information checkout: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/ |
| api.podSecurityContext.fsGroup | int | `65532` |  |
| api.podSecurityContext.runAsGroup | int | `65532` |  |
| api.podSecurityContext.runAsNonRoot | bool | `true` |  |
| api.podSecurityContext.runAsUser | int | `65532` |  |
| api.podSecurityContext.seccompProfile.type | string | `"RuntimeDefault"` |  |
| api.readinessProbe.failureThreshold | int | `3` |  |
| api.readinessProbe.httpGet.path | string | `"/readyz"` |  |
| api.readinessProbe.httpGet.port | string | `"http"` |  |
| api.readinessProbe.initialDelaySeconds | int | `5` |  |
| api.readinessProbe.periodSeconds | int | `3` |  |
| api.readinessProbe.successThreshold | int | `1` |  |
| api.readinessProbe.timeoutSeconds | int | `1` |  |
| api.replicaCount | int | `1` | This will set the replicaset count more information can be found here: https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/ |
| api.resources | object | `{}` |  |
| api.sampleEmailBasedOIDCConfig | object | `{"allowedDomain":"","clientID":"","clientSecret":"","groupsClaim":"groups","issuerURL":"","providerName":""}` | Sample OIDC identity-provider bootstrap based on the email claim. When issuerURL and clientID are set, an IdentityProvider YAML file is appended to the bootstrap config Secret. This provider: - drives the browser redirect login, unless global.demo.enabled is set,   in which case the demo keycloak provider keeps that role - redirects to the issuer's discovery-advertised authorization URL - uses the specified client ID and secret - authenticates user with username "&lt;providerName&gt;:&lt;email_claim&gt;" - maps the groupsClaim to hub groups, prefixed with "&lt;providerName&gt;:" - requires the email_verified claim to be true - (if allowedDomain is set) forces the email string to end with @&lt;allowedDomain&gt; |
| api.sampleEmailBasedOIDCConfig.allowedDomain | string | `""` | Optional: restrict logins to a single email domain |
| api.sampleEmailBasedOIDCConfig.clientID | string | `""` | OIDC client ID (audience) |
| api.sampleEmailBasedOIDCConfig.clientSecret | string | `""` | OIDC client secret for the redirect flow |
| api.sampleEmailBasedOIDCConfig.groupsClaim | string | `"groups"` | Token claim carrying the user's group membership. Group values are prefixed with "&lt;providerName&gt;:", so an OrganizationRoleBinding subject for the "admin" group is named "&lt;providerName&gt;:admin". Providers that publish groups under a non-standard claim need this overridden -- e.g. Amazon Cognito uses "cognito:groups". Set to "" to omit the mapping, which leaves only per-user (email) role bindings working. |
| api.sampleEmailBasedOIDCConfig.issuerURL | string | `""` | OIDC issuer URL (e.g. https://accounts.google.com) |
| api.sampleEmailBasedOIDCConfig.providerName | string | `""` | Name of the OIDC provider (default: "oidc") |
| api.securityContext.allowPrivilegeEscalation | bool | `false` |  |
| api.securityContext.capabilities.drop[0] | string | `"ALL"` |  |
| api.securityContext.privileged | bool | `false` |  |
| api.securityContext.readOnlyRootFilesystem | bool | `true` |  |
| api.securityContext.runAsGroup | int | `65532` |  |
| api.securityContext.runAsNonRoot | bool | `true` |  |
| api.securityContext.runAsUser | int | `65532` |  |
| api.securityContext.seccompProfile.type | string | `"RuntimeDefault"` |  |
| api.service | object | `{"annotations":{},"api":{"port":8080,"type":"ClusterIP"},"metrics":{"port":8085,"type":"ClusterIP"}}` | This is for setting up a service more information can be found here: https://kubernetes.io/docs/concepts/services-networking/service/ |
| api.service.api | object | `{"port":8080,"type":"ClusterIP"}` | The main service for the API. |
| api.service.metrics | object | `{"port":8085,"type":"ClusterIP"}` | The Prometheus metrics endpoint service for the API. |
| api.serviceAccount | object | `{"annotations":{},"automount":true,"create":true,"name":""}` | This section builds out the service account more information can be found here: https://kubernetes.io/docs/concepts/security/service-accounts/ |
| api.serviceAccount.annotations | object | `{}` | Annotations to add to the service account |
| api.serviceAccount.automount | bool | `true` | Automatically mount a ServiceAccount's API credentials? |
| api.serviceAccount.create | bool | `true` | Specifies whether a service account should be created |
| api.serviceAccount.name | string | `""` | The name of the service account to use. If not set and create is true, a name is generated using the fullname template |
| api.signingKey | object | `{"annotations":{},"existingSecretRef":{"name":""},"generate":true}` | Signing key for hub-issued JWTs. Must be an ECDSA P-256 key pair in Kubernetes TLS Secret format (standard tls.crt + tls.key keys). |
| api.signingKey.existingSecretRef | object | `{"name":""}` | Reference to a pre-existing TLS Secret. When existingSecretRef.name is set, the chart will not generate one. The Secret MUST use the standard tls.crt / tls.key keys. |
| api.startupProbe | object | (see fields below) | Startup probe gives slow first-start work (signing-key gen, HMAC gen) room to finish before liveness starts evicting the pod. |
| api.tokenExchange | object | `{"port":8444,"service":{"annotations":{},"type":"ClusterIP"}}` | The internal Hub OIDC token exchange service for the API. |
| api.tolerations | list | `[]` |  |
| api.tracing | object | `{"enabled":false,"url":""}` | OpenTelemetry tracing configuration. |
| api.updateStrategy | object | `{"rollingUpdate":{"maxSurge":1,"maxUnavailable":0},"type":"RollingUpdate"}` | Deployment update strategy. Defaults to RollingUpdate with maxSurge=1 / maxUnavailable=0. During a rolling upgrade the pod count stays at replicaCount + 1, never below replicaCount, so an in-flight request is always served by a Ready pod. |
| apisql | object | `{"image":{"repository":"hub-sql-migrate","tag":""}}` | Configuration for the hub-sql-migrate migration container |
| apisql.image.repository | string | `"hub-sql-migrate"` | Override the registry for this image (defaults to global registry) registry: "" |
| apisql.image.tag | string | `""` | Overrides the image tag whose default is the chart appVersion. |
| bootstrap | object | `{"admins":[],"files":{}}` | Bootstrap configuration loaded by hub-core at startup. |
| bootstrap.admins | list | `[]` | Subjects granted both org-admin and realm-admin of the "default" realm. A convenience shortcut so operators declare admins in one place instead of maintaining an OrganizationRoleBinding and a RealmRoleBinding in lockstep. Users who need finer-grained scoping (org-admin only, or realm-admin of a non-default realm) should provide raw manifests via bootstrap.files instead. |
| bootstrap.files | object | `{}` | YAML files to include in the bootstrap config Secret. Each key is a filename and each value is the file content. Use this to register IdentityProviders, ControlPlanes, or OrganizationRoleBindings at install time. To register a connector against a bootstrapped ControlPlane, mint a token via the registrationtoken subresource after install.  Example:   files:     my-cp.yaml: |       apiVersion: hub.upbound.io/v1alpha1       kind: ControlPlane       metadata:         name: my-cp         namespace: default |
| global | object | `{}` | Populated by the umbrella chart at install time. |
| httpRoute | object | `{"annotations":{},"domain":"","enabled":false,"hostnames":[],"labels":{},"parentRefs":[],"subdomain":"api"}` | Kubernetes Gateway API HTTPRoute. When installed under the umbrella with global.gateway.enabled, the umbrella's parentRef and domain win. For standalone installs, set enabled=true and supply parentRefs (or subdomain+domain). |
| httpRoute.hostnames | list | `[]` | If set, replaces the composed &lt;subdomain&gt;.&lt;domain&gt; hostname. |
| imagePullSecrets | list | `[]` | Chart-wide image pull secrets. Falls back to global.imagePullSecrets. |
| otelGateway | object | (see fields below) | Feature gate: Metrics (alpha). These values configure the Metrics feature and are only consumed when the Metrics gate is enabled. Enabling that gate requires otelGateway.enabled=true.  When enabled, deploys an OpenTelemetry Collector as a gateway that receives metrics from control plane collectors via OTLP and writes them to Prometheus. |
| otelGateway.image | object | `{"digest":"","pullPolicy":"IfNotPresent","registry":"","repository":"opentelemetry-collector-hub","tag":""}` | OpenTelemetry Collector image for the otel-gateway. Defaults to Upbound's build, which includes only the components this pipeline needs; override the fields below to run any other collector image. |
| otelGateway.image.digest | string | `""` | Optional SHA256 digest pin. |
| otelGateway.image.registry | string | `""` | Overrides the chart-wide registry for this workload. |
| otelGateway.image.tag | string | `""` | Overrides the image tag whose default is the chart appVersion. |
| otelGateway.metricAllowlist | list | `["controller_runtime_reconcile_total","controller_runtime_reconcile_errors_total","controller_runtime_reconcile_time_seconds.*","upjet_resource_external_api_calls_total","function_run_function_seconds.*","kube_customresource_.*"]` | Safety-net metric allowlist - re-validates the curated set in case a source collector sends unfiltered data. |
| otelGateway.metrics | object | `{"amp":{"region":"","writeEndpoint":""},"backend":"","gmp":{"project":""},"prometheus":{"insecure":true,"writeEndpoint":""},"queryURL":""}` | metrics selects which Prometheus-compatible backend the gateway ships to, and where the metrics query API reads them back. Only the selected backend's settings are used. |
| otelGateway.metrics.backend | string | `""` | backend selects the exporter. Required when otelGateway.enabled - set it explicitly rather than relying on a default.   prometheus - Prometheus remote-write (self-hosted, or any remote-write                endpoint)   gmp        - native Google Managed Prometheus exporter (gRPC, ADC)   amp        - Amazon Managed Prometheus: remote-write signed with AWS                SigV4 (credentials from the pod, e.g. IRSA) |
| otelGateway.metrics.gmp | object | `{"project":""}` | Settings for the "gmp" backend. The exporter writes to the Google Cloud Monitoring API - there is no endpoint to configure, only the project - and authenticates via Application Default Credentials, so the gateway ServiceAccount must carry a Google identity with roles/monitoring.metricWriter (Workload Identity or a mounted key), wired at deploy time. |
| otelGateway.metrics.gmp.project | string | `""` | GCP project metrics are written to. Auto-detected from the pod environment when empty. |
| otelGateway.metrics.prometheus | object | `{"insecure":true,"writeEndpoint":""}` | Settings for the "prometheus" backend. |
| otelGateway.metrics.prometheus.insecure | bool | `true` | Disable client transport security. Does not skip certificate verification: an https:// writeEndpoint stays verified either way. |
| otelGateway.metrics.prometheus.writeEndpoint | string | `""` | Remote-write URL the gateway pushes metrics to. |
| otelGateway.metrics.queryURL | string | `""` | Base URL the metrics query API reads from. Deployment-specific: a Prometheus/Thanos service, a GMP-compatible endpoint (e.g. a GMP frontend proxy) for the gmp backend, or the AMP workspace URL for the amp backend. |
| otelGateway.service.grpc | object | `{"port":4317}` | The OTLP gRPC receiver port. |
| otelGateway.service.http | object | `{"port":4318}` | The OTLP HTTP receiver port. |
| postgresql.auth.aws | object | `{"region":""}` | AWS RDS IAM settings, used when cloud is "aws". |
| postgresql.auth.aws.region | string | `""` | RDS region. Falls back to the AWS_REGION env var when unset. |
| postgresql.auth.cloud | string | `""` | Cloud provider for IAM auth. Required when mode is "iam". One of: "aws", "gcp", "azure" (only "aws" is implemented today). |
| postgresql.auth.mode | string | `"password"` | Authentication mode: "password" (default) or "iam". In iam mode hub-core mints a short-lived cloud IAM token per connection - no static credential is set, and the connection is forced over TLS (sslmode=require minimum). |
| postgresql.auth.password | object | `{"existingSecretRef":{"key":"password","name":""},"value":""}` | Postgres password. Used in password auth mode. Provide either the plaintext value (dev only) or a reference to an existing Secret. |
| postgresql.auth.password.existingSecretRef | object | `{"key":"password","name":""}` | Reference to an existing Secret holding the password. |
| postgresql.auth.password.value | string | `""` | Plaintext password — dev only, not recommended for production. |
| postgresql.connectionString | string | `""` | Option 1: Provide a full connection string (takes precedence over individual parameters) |
| postgresql.database | string | `"postgres"` |  |
| postgresql.host | string | `""` | Option 2: Provide individual connection parameters |
| postgresql.port | int | `5432` |  |
| postgresql.sslmode | string | `"disable"` |  |
| postgresql.user | string | `"postgres"` |  |
| registry | string | `"xpkg.upbound.io/upbound"` | Chart-wide default registry. Per-workload &lt;workload&gt;.image.registry overrides this. Falls back to global.imageRegistry when both are empty. |

## `hub-connector` chart

A Helm chart for deploying the Hub Connector

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| collector | object | (see fields below) | OTEL collector that scrapes control plane metrics, filters to a curated set, stamps identity labels, and exports to the hub-side gateway. |
| collector.image | object | `{"digest":"","pullPolicy":"IfNotPresent","registry":"","repository":"opentelemetry-collector-hub","tag":""}` | OpenTelemetry Collector image for the connector's scrape collector. Defaults to Upbound's build, which includes only the components this pipeline needs; override the fields below to run any other collector image. |
| collector.image.digest | string | `""` | Optional SHA256 digest pin. |
| collector.image.registry | string | `""` | Overrides the chart-wide registry for this workload. |
| collector.image.tag | string | `""` | Overrides the image tag whose default is the chart appVersion. |
| collector.metricAllowlist | list | `["controller_runtime_reconcile_total","controller_runtime_reconcile_errors_total","controller_runtime_reconcile_time_seconds.*","upjet_resource_external_api_calls_total","function_run_function_seconds.*","kube_customresource_.*"]` | Curated metric allowlist - only these metrics leave the control plane. |
| collector.scrapeNamespaces | list | `["crossplane-system","upbound-system"]` | Namespaces to scrape for Crossplane metrics. The collector discovers pods with label app=crossplane in these namespaces and scrapes port 8080. - Vanilla Crossplane: ["crossplane-system"] - UXP: ["upbound-system"] |
| connector | object | (see fields below) | Main connector workload. Exchanges registration token for a hub credential, pushes JWKS, and syncs cluster resources to the hub. |
| connector.credentials | object | `{"existingSecretRef":{"key":"registrationToken","name":"hub-connector-credentials"}}` | Credentials the connector exchanges for a Hub JWT on first start. |
| connector.featureFlags | object | `{"enabled":false,"ofrepHost":"","ofrepPort":8016}` | Feature flag evaluation via hub-core's OFREP endpoint. |
| connector.hub | object | `{"allowInsecure":false,"tokenExchangeUrl":"","url":""}` | hub-core connection. Where the connector talks to. |
| connector.hub.allowInsecure | bool | `false` | Permit plaintext HTTP to hub.url. Required when running against a non-TLS Hub (e.g. demo mode or an in-cluster Service). |
| connector.hub.tokenExchangeUrl | string | `""` | URL of the Hub token exchange endpoint. Defaults to hub.url. |
| connector.hub.url | string | `""` | hub-core URL. If empty, falls back to global.apiServiceName + global.apiServicePort. |
| connector.hubAuthServiceAccount | object | `{"name":"","namespace":""}` | ServiceAccount whose token the connector mints from the control plane it represents and exchanges for a hub credential. Defaults to the connector's own ServiceAccount in the release namespace, which is correct for an in-cluster install. For a connector that reaches its control plane through a mounted kubeconfig, set these to a ServiceAccount that exists in that cluster. |
| connector.image.registry | string | `""` | Overrides the chart-wide registry for this workload. |
| connector.initImage | string | `"busybox:1.38"` | Image used by the demo-mode init container that waits for hub-core. |
| connector.jwks | object | `{"pushInterval":"1h"}` | JWKS publishing. The connector pushes its cluster's signing keys to hub-core so the hub can verify the tokens the connector mints. |
| connector.livenessProbe | object | `{}` | TODO: connector binary doesn't yet serve /livez/readyz. Once a health listener is added, populate these with the standard probe quartet. |
| connector.service | object | `{"annotations":{},"port":4318,"type":"ClusterIP"}` | The connector's local metrics-proxy Service. Only rendered when collector.enabled is true; the collector forwards through it to the upstream hub-side OTEL gateway. |
| connector.spaces | object | (see fields below) | Spaces integration. When enabled, reconciles ObjectRoleBinding and RealmRoleBinding resources against a Spaces API server. |
| connector.spaces.controlPlaneConnector | object | `{"debug":null,"excludeResources":[],"jwksPushInterval":null,"rediscoveryInterval":null,"resources":{}}` | Config for the per-control-plane connectors a space connector deploys. Each field defaults to the space connector's own config; set one to override it for every control plane connector in the space. |
| connector.spaces.controlPlaneConnector.excludeResources | list | `[]` | Resources to exclude from syncing, formatted as "apiVersion=&lt;apiVersion&gt;,kind=&lt;Kind&gt;". Can be repeated. |
| connector.spaces.controlPlaneConnector.resources | object | `{}` | Compute resource requests/limits for control plane connectors. Defaults to the space connector's own resources; set to override. |
| connector.sync | object | `{"excludeResources":[],"limitToClusterRoles":["crossplane-admin"],"rediscoveryInterval":"20s"}` | Resource sync - controls which Kubernetes resources are synced to the Hub and how aggressively the connector rediscovers the cluster API surface. |
| connector.sync.excludeResources | list | `[]` | Resources to exclude from syncing, formatted as "apiVersion=&lt;apiVersion&gt;,kind=&lt;Kind&gt;". Can be repeated. |
| connector.sync.limitToClusterRoles | list | `["crossplane-admin"]` | ClusterRoles whose rules define which resources are synced. Only resources authorized by at least one of these roles are synced. Set to [] to sync all resources (no ClusterRole filtering). In demo mode (global.demo.enabled) this default is replaced with the built-in cluster-admin role to smooth the demo experience. |
| global | object | `{}` | Populated by the umbrella chart at install time. |
| imagePullSecrets | list | `[]` | Chart-wide image pull secrets. Falls back to global.imagePullSecrets. |
| registry | string | `"xpkg.upbound.io/upbound"` | Chart-wide default registry. Per-workload &lt;workload&gt;.image.registry overrides this. Falls back to global.imageRegistry when both are empty. |
| rsm | object | (see fields below) | Resource State Metrics. Exposes per-resource condition gauges. Wired through the collector. Only rendered when collector.enabled AND rsm.enabled. |
| rsm.apiGroups | list | `["*"]` | API groups to watch. Controls both RBAC and the ResourceMetricsMonitor stores - one store per group. Each group creates informers that consume memory. Defaults to all groups. To reduce resource usage, scope to specific provider groups (e.g. ["pkg.crossplane.io", "s3.aws.upbound.io"]). |
| rsm.image.registry | string | `"xpkg.crossplane.io"` | Overrides the chart-wide registry for this workload. |
| rsm.monitor.create | bool | `true` | Whether to render the ResourceMetricsMonitor in the release namespace. |
