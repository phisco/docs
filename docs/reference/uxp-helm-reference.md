---
title: UXP Helm Chart Reference
sidebar_position: 20
description: UXP Helm chart configuration values
mdx:
    format: md
---

<!-- vale off -->

This reference provides detailed documentation on the UXP Helm chart. This Helm chart contains configuration values for installation, configuration, and management of UXP.

## Values

<div class="helm-table">

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` | Add `affinities` to the Crossplane pod deployment. |
| apollo.account | string | `"notdemo"` | The Upbound organization this installation is associated with. |
| apollo.apollo | object | { ... } | Configurations for the apollo deployment. |
| apollo.apollo.affinity | object | `{}` | Add `affinities` to the apollo pod deployment. |
| apollo.apollo.apiserver.command | list | `[]` | Command for the apollo apiserver deployment. |
| apollo.apollo.apiserver.debug | bool | `false` | Whether apollo api server should be deployed in debug mode. |
| apollo.apollo.apiserver.extraArgs | list | `[]` | Additional arguments to be added to the apollo apiserver deployment. |
| apollo.apollo.apiserver.extraEnv | list | `[]` | Additional environment variables to be added to the apollo apiserver deployment. |
| apollo.apollo.apiserver.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy for the apollo apiserver image. |
| apollo.apollo.apiserver.image.repository | string | `"uxp-apollo"` | Repository for the apollo apiserver image. |
| apollo.apollo.apiserver.image.tag | string | `""` | Tag for the apollo apiserver image. |
| apollo.apollo.apiserver.resources.limits.cpu | string | `"1000m"` | CPU limit for the apollo apiserver deployment. |
| apollo.apollo.apiserver.resources.limits.memory | string | `"500Mi"` | Memory limit for the apollo apiserver deployment. |
| apollo.apollo.apiserver.resources.requests.cpu | string | `"100m"` | CPU request for the apollo apiserver deployment. |
| apollo.apollo.apiserver.resources.requests.memory | string | `"200Mi"` | Memory request for the apollo apiserver deployment. |
| apollo.apollo.apiserver.service.admin.port | int | `8083` | Port for the apollo admin service. |
| apollo.apollo.apiserver.service.api.port | int | `8080` | Port for the apollo apiserver service. |
| apollo.apollo.apiserver.service.ingest.port | int | `8082` | Port for the apollo ingest service. |
| apollo.apollo.apiserver.service.metrics.port | int | `8085` | Port for the apollo apiserver metrics service. |
| apollo.apollo.apiserver.service.type | string | `"ClusterIP"` | Type of service for the apollo apiserver service. |
| apollo.apollo.hpa.enabled | bool | `false` | This enables the Horizontal Pod Autoscaler for the apollo deployment. |
| apollo.apollo.hpa.maxReplicas | int | `5` | The maximum number of replicas for the Horizontal Pod Autoscaler. |
| apollo.apollo.hpa.minReplicas | int | `1` | The minimum number of replicas for the Horizontal Pod Autoscaler. |
| apollo.apollo.hpa.targetCPUUtilizationPercentage | int | `80` | The target CPU utilization percentage for the Horizontal Pod Autoscaler. |
| apollo.apollo.hpa.targetMemoryUtilizationPercentage | int | `80` | The target memory utilization percentage for the Horizontal Pod Autoscaler. |
| apollo.apollo.mode.deploymentMode | string | `"single-tenant"` | The deployment mode of the apollo server. |
| apollo.apollo.nodeSelector | object | `{}` | Add `nodeSelectors` to the apollo pod deployment. |
| apollo.apollo.observability.enabled | bool | `false` | Add Prometheus annotations to the apollo apiserver deployment. |
| apollo.apollo.observability.tracing | object | `{"enabled":false,"endpoint":"otel-collector.monitoring.svc.cluster.local","insecure":false,"port":4317,"sampling":{"rate":0.1},"serviceName":"query-api","tls":{"caBundleSecretRef":""}}` | Unified tracing configuration for Apollo components (apiserver). |
| apollo.apollo.observability.tracing.enabled | bool | `false` | Enable distributed tracing for Apollo components. When disabled, no traces are collected or sent, regardless of other tracing settings. |
| apollo.apollo.observability.tracing.endpoint | string | `"otel-collector.monitoring.svc.cluster.local"` | OTLP-compatible endpoint for traces. Supports both in-cluster and external collectors. For external collectors, set to the full hostname. |
| apollo.apollo.observability.tracing.insecure | bool | `false` | Use insecure connection (development only). Set to false for production with TLS. |
| apollo.apollo.observability.tracing.port | int | `4317` | OTLP gRPC port for trace export. |
| apollo.apollo.observability.tracing.sampling | object | `{"rate":0.1}` | Sampling configuration for distributed tracing. |
| apollo.apollo.observability.tracing.sampling.rate | float | `0.1` | Trace sampling rate (0.0-1.0). Controls what fraction of traces are collected. Uses parent-based sampling: if a trace is started upstream with sampling decision, that decision is respected. For new traces (no parent), this rate determines sampling probability. Default 0.1 (10%) |
| apollo.apollo.observability.tracing.serviceName | string | `"query-api"` | Service name reported in traces. Override to match the deployment context |
| apollo.apollo.observability.tracing.tls | object | `{"caBundleSecretRef":""}` | TLS configuration for the OTLP collector connection. |
| apollo.apollo.observability.tracing.tls.caBundleSecretRef | string | `""` | Name of the secret containing a CA bundle for validating the collector's certificate. The secret must contain a key named 'ca.crt' with the PEM-encoded CA bundle. Use this when connecting to external collectors with TLS. If empty and insecure is false, uses the default Spaces CA. |
| apollo.apollo.podAnnotations | object | `{}` | Annotations to be added to the apollo apiserver pods. |
| apollo.apollo.podLabels | object | `{}` | Labels to be added to the apollo apiserver pods. |
| apollo.apollo.podSecurityContext | object | `{"fsGroup":1000}` | Pod security context for the apollo deployment. |
| apollo.apollo.replicaCount | int | `1` | Number of replicas for the apollo apiserver deployment. |
| apollo.apollo.secretRefs.spacesCa | object | `{"key":"ca.crt","name":"spaces-ca"}` | Spaces API CA certificate secret. Used in multi-tenant mode to verify the spaces-api TLS server. |
| apollo.apollo.secretRefs.spacesCa.name | string | `"spaces-ca"` | Name of the secret containing the PEM-encoded CA bundle. |
| apollo.apollo.secretRefs.tlsSecretName | string | `"spaces-apollo-cert"` | Name of the secret containing the apollo server's TLS certificate. |
| apollo.apollo.security.fips | object | `{"enabled":false}` | Whether FIPS mode should be enforced at runtime. |
| apollo.apollo.serviceAccount.annotations | object | `{}` | Annotations to be added to the apollo service account, if created. |
| apollo.apollo.serviceAccount.create | bool | `true` | Whether to create a service account for the apollo deployment. |
| apollo.apollo.serviceAccount.name | string | `"apollo"` | The name of the service account to be created. Expected to exist if create is set to false. |
| apollo.apollo.storage.postgres.cnpg | object | { ... } | Configuration for the PostgreSQL cluster and PGBouncer pooler managed by CloudNativePG, only respected if create is set to true. |
| apollo.apollo.storage.postgres.cnpg.cluster.debug | bool | `false` | Setting the cluster to log at debug level, sets up PgAudit and other useful extensions for debugging. |
| apollo.apollo.storage.postgres.cnpg.cluster.imageName | string | `"ghcr.io/cloudnative-pg/postgresql:16"` | Image to be used for the cluster, if not specified the default image according to the CloudNativePG operator installed version will be used. |
| apollo.apollo.storage.postgres.cnpg.cluster.instances | int | `2` | Number of instances in the postgres cluster. |
| apollo.apollo.storage.postgres.cnpg.cluster.parameters | object | `{"max_connections":"100"}` | The Postgres configuration, see Postgres documentation for all available options and CloudNativePG for all allowed ones. Tune the suggested parameters as needed. |
| apollo.apollo.storage.postgres.cnpg.cluster.resources.requests.cpu | int | `2` | CPU request for the spaces control plane Postgres cluster pod. |
| apollo.apollo.storage.postgres.cnpg.cluster.resources.requests.memory | string | `"4Gi"` | Memory request for the spaces control plane Postgres cluster pod. |
| apollo.apollo.storage.postgres.cnpg.cluster.storage.pvcTemplate | object | `{}` | A full PVC template for the PVCs used by the cluster. |
| apollo.apollo.storage.postgres.cnpg.cluster.storage.size | string | `"5Gi"` | The size of the PVCs for the cluster. |
| apollo.apollo.storage.postgres.cnpg.cluster.storage.storageClass | string | `""` | The storage class to use for the cluster's PVCs. |
| apollo.apollo.storage.postgres.cnpg.cluster.walStorage.enabled | bool | `false` | Whether to use a separate PVC for WAL storage for the cluster. |
| apollo.apollo.storage.postgres.cnpg.cluster.walStorage.pvcTemplate | object | `{}` | A full PVC template for the PVCs used by the cluster to store WALs. |
| apollo.apollo.storage.postgres.cnpg.cluster.walStorage.size | string | `"5Gi"` | The size of the PVCs for the cluster WAL storage. |
| apollo.apollo.storage.postgres.cnpg.cluster.walStorage.storageClass | string | `""` | The storage class to use for the cluster's PVCs for WAL storage. |
| apollo.apollo.storage.postgres.cnpg.pooler | object | `{"debug":false,"enabled":true,"instances":2,"parameters":{"default_pool_size":"1","max_client_conn":"1000","max_db_connections":"0","max_prepared_statements":"1000"},"podTemplate":{}}` | The pooler configuration for the cluster. |
| apollo.apollo.storage.postgres.cnpg.pooler.debug | bool | `false` | Whether the pooler should log at debug level. |
| apollo.apollo.storage.postgres.cnpg.pooler.enabled | bool | `true` | Whether the pooler should be enabled. |
| apollo.apollo.storage.postgres.cnpg.pooler.instances | int | `2` | The number of replicas of the pooler to run. |
| apollo.apollo.storage.postgres.cnpg.pooler.parameters | object | `{"default_pool_size":"1","max_client_conn":"1000","max_db_connections":"0","max_prepared_statements":"1000"}` | The pooler configuration, see PGbouncer documentation for all available options. Tune the suggested parameters as needed. |
| apollo.apollo.storage.postgres.cnpg.pooler.podTemplate | object | `{}` | The pod template for the pooler, allows configuring almost all aspects of the pooler pods. |
| apollo.apollo.storage.postgres.connection | object | `{"apollo":{"credentials":{"format":"","secret":{"name":""},"user":""},"sslmode":"","url":""},"ca":{"name":""},"credentials":{"format":"pgpass","secret":{"name":""},"user":""},"database":"upbound","sslmode":"require","syncer":{"credentials":{"format":"","secret":{"name":""},"user":""},"sslmode":"","url":""},"url":""}` | Configuration for the Apollo database connection, only respected if create is set to false. |
| apollo.apollo.storage.postgres.connection.apollo.credentials | object | `{"format":"","secret":{"name":""},"user":""}` | The credentials for the connection from apollo server. Defaults to the one set in connection.credentials, if not set. |
| apollo.apollo.storage.postgres.connection.apollo.credentials.format | string | `""` | The format of the credentials for the connection from apollo server. Defaults to the one set in connection.credentials.format, if not set. |
| apollo.apollo.storage.postgres.connection.apollo.credentials.secret.name | string | `""` | Name of the secret containing the specified user's credentials. Defaults to the one set in connection.credentials.secret.name, if not set. |
| apollo.apollo.storage.postgres.connection.apollo.credentials.user | string | `""` | The user to connect from apollo server as. Defaults to the one set in connection.credentials.user, if not set. |
| apollo.apollo.storage.postgres.connection.apollo.sslmode | string | `""` | sslmode for the connection from apollo server. Defaults to the one set in connection.sslmode, if not set. |
| apollo.apollo.storage.postgres.connection.apollo.url | string | `""` | The url for the connection from apollo server. Defaults to the one set in connection.url, if not set. |
| apollo.apollo.storage.postgres.connection.ca.name | string | `""` | Name of the secret containing the CA certificate to verify the connection with, if needed. |
| apollo.apollo.storage.postgres.connection.credentials.format | string | `"pgpass"` | The format of the credentials, either pgpass or basicauth. |
| apollo.apollo.storage.postgres.connection.credentials.secret.name | string | `""` | Name of the secret containing the specified user's credentials. |
| apollo.apollo.storage.postgres.connection.credentials.user | string | `""` | The user to connect to the database as. |
| apollo.apollo.storage.postgres.connection.sslmode | string | `"require"` | sslmode for the connection to the database. |
| apollo.apollo.storage.postgres.connection.syncer.credentials.format | string | `""` | Format of the credentials for the connection from apollo syncers. Defaults to the one set in connection.credentials.format, if not set. |
| apollo.apollo.storage.postgres.connection.syncer.credentials.secret.name | string | `""` | The name of the secret containing the specified user's credentials. If not set, a per syncer password will be generated and stored in a secret. |
| apollo.apollo.storage.postgres.connection.syncer.credentials.user | string | `""` | The user to connect from apollo syncers. If not set, a per syncer user will be created and granted the necessary permissions. |
| apollo.apollo.storage.postgres.connection.syncer.sslmode | string | `""` | sslmode for the connection from apollo syncer. Defaults to the one set in connection.sslmode, if not set. |
| apollo.apollo.storage.postgres.connection.syncer.url | string | `""` | sslmode for the connection from apollo syncer. Defaults to the one set in connection.url, if not set. |
| apollo.apollo.storage.postgres.connection.url | string | `""` | The url for the connection to the database. Just the hostname is required, the rest of the connection string will be built from the other fields. |
| apollo.apollo.storage.postgres.create | bool | `false` | Whether the chart should install and handle the PostgreSQL database for Apollo using CloudNativePG, if set to true all connection configuration will be ignored. |
| apollo.apollo.storage.postgres.persistent | bool | `false` | Whether to use a persistent volume for the postgres container storage |
| apollo.apollo.storage.postgres.sidecar | bool | `true` | Whether to run postgres in a sidecar container. |
| apollo.apollo.storage.postgres.sidecarImage | object | `{"pullPolicy":"IfNotPresent","repository":"postgres","tag":"14"}` | Image used for the postgres sidecar when sidecar is enabled. Not prefixed by .Values.registry so it can be sourced from any registry, including private/internal mirrors of upstream postgres images. |
| apollo.apollo.storage.postgres.sidecarImage.pullPolicy | string | `"IfNotPresent"` | Image pull policy for the postgres sidecar image. |
| apollo.apollo.storage.postgres.sidecarImage.repository | string | `"postgres"` | Repository for the postgres sidecar image, including registry host if not the default Docker Hub. |
| apollo.apollo.storage.postgres.sidecarImage.tag | string | `"14"` | Tag for the postgres sidecar image. |
| apollo.apollo.storage.postgres.size | string | `"5Gi"` | Size of the persistent volume |
| apollo.apollo.storage.postgres.storageClass | string | `""` | Storage class to use for the persistent volume |
| apollo.apollo.syncer.command | list | `[]` | Command for the apollo syncer deployment. |
| apollo.apollo.syncer.debug | bool | `false` | Whether apollo syncer should be deployed in debug mode. |
| apollo.apollo.syncer.extraArgs | list | `[]` | Additional arguments to pass to the apollo syncer container. |
| apollo.apollo.syncer.extraEnv | list | `[]` | Additional environment variables to be added to the apollo syncer deployment. |
| apollo.apollo.syncer.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy for the apollo syncer image. |
| apollo.apollo.syncer.image.repository | string | `"uxp-apollo"` | Repository for the apollo syncer image. |
| apollo.apollo.syncer.image.tag | string | `""` | Tag for the apollo syncer image. |
| apollo.apollo.syncer.metrics.enabled | bool | `true` | Whether apollo syncers should expose metrics. |
| apollo.apollo.syncer.metrics.port | int | `8081` | Port for the apollo syncer metrics service. |
| apollo.apollo.syncer.resources.limits.cpu | string | `"1000m"` | CPU limit for the apollo syncer deployment. |
| apollo.apollo.syncer.resources.limits.memory | string | `"1024Mi"` | Memory limit for the apollo syncer deployment. |
| apollo.apollo.syncer.resources.requests.cpu | string | `"100m"` | CPU request for the apollo syncer deployment. |
| apollo.apollo.syncer.resources.requests.memory | string | `"150Mi"` | Memory request for the apollo syncer deployment. |
| apollo.apollo.tolerations | list | `[]` | Add `tolerations` to the apollo pod deployment. |
| apollo.apollo.topologySpreadConstraints | list | `[]` | Add `topologySpreadConstraints` to the apollo pod deployment. |
| apollo.fullnameOverride | string | `""` | The full name of the chart, including the repository name. |
| apollo.imagePullSecrets | list | `[]` | Global image pull secrets |
| apollo.nameOverride | string | `""` | The name of the chart. |
| apollo.registry | string | `"xpkg.upbound.io/upbound"` | Specifies the registry where the containers used in the spaces deployment are served from. |
| apollo.securityContext | object | `{}` | Global security context |
| apollo.version | string | `""` | Overall artifact version that affects xpkgs and related components. |
| args | list | `["--enable-operations","--package-runtime=External"]` | Add custom arguments to the Crossplane pod. |
| configuration.packages | list | `[]` | A list of Configuration packages to install. |
| customAnnotations | object | `{}` | Add custom `annotations` to the Crossplane pod deployment. |
| customLabels | object | `{}` | Add custom `labels` to the Crossplane pod deployment. |
| deploymentStrategy | string | `"RollingUpdate"` | The deployment strategy for the Crossplane and RBAC Manager pods. |
| dnsPolicy | string | `""` | Specify the `dnsPolicy` to be used by the Crossplane pod. |
| extraEnvVarsCrossplane | object | `{}` | Add custom environmental variables to the Crossplane pod deployment application container. Replaces any `.` in a variable name with `_`. For example, `SAMPLE.KEY=value1` becomes `SAMPLE_KEY=value1`. |
| extraEnvVarsCrossplaneInit | object | `{}` | Add custom environmental variables to the Crossplane pod deployment init container. Replaces any `.` in a variable name with `_`. For example, `SAMPLE.KEY=value1` becomes `SAMPLE_KEY=value1`. |
| extraEnvVarsRBACManager | object | `{}` | Add custom environmental variables to the RBAC Manager pod deployment. Replaces any `.` in a variable name with `_`. For example, `SAMPLE.KEY=value1` becomes `SAMPLE_KEY=value1`. |
| extraObjects | list | `[]` | To add arbitrary Kubernetes Objects during a Helm Install |
| extraVolumeMountsCrossplane | object | `{}` | Add custom `volumeMounts` to the Crossplane pod. Supports template expressions. |
| extraVolumesCrossplane | object | `{}` | Add custom `volumes` to the Crossplane pod. Supports template expressions. |
| function.packages | list | `[]` | A list of Function packages to install |
| functionCache.medium | string | `""` | Set to `Memory` to hold the function cache in a RAM backed file system. Useful for Crossplane development. |
| functionCache.pvc | string | `""` | The name of a PersistentVolumeClaim to use as the function cache. Disables the default function cache `emptyDir` Volume. |
| functionCache.sizeLimit | string | `"512Mi"` | The size limit for the function cache. If medium is `Memory` the `sizeLimit` can't exceed Node memory. |
| hostNetwork | bool | `false` | Enable `hostNetwork` for the Crossplane deployment. Caution: enabling `hostNetwork` grants the Crossplane Pod access to the host network namespace. Consider setting `dnsPolicy` to `ClusterFirstWithHostNet`. |
| image.ignoreTag | bool | `false` | Do not use the {{ .image.tag }} value to compute the image uri. |
| image.pullPolicy | string | `"IfNotPresent"` | The image pull policy used for Crossplane and RBAC Manager pods. |
| image.repository | string | `"xpkg.upbound.io/upbound/crossplane"` | Repository for the Crossplane pod image. |
| image.tag | string | `"v2.3.4-up.1"` | The Crossplane image tag. Defaults to the value of `appVersion` in `Chart.yaml`. |
| imagePullSecrets | list | `[]` | The imagePullSecret names to add to the Crossplane ServiceAccount. |
| leaderElection | bool | `true` | Enable [leader election](https://docs.crossplane.io/latest/guides/pods/#leader-election) for the Crossplane pod. |
| metrics.enabled | bool | `true` | Enable Prometheus path, port and scrape annotations and expose port 8080 for both the Crossplane and RBAC Manager pods. |
| metrics.port | string | `""` | The port the metrics server listens on. |
| nodeSelector | object | `{}` | Add `nodeSelectors` to the Crossplane pod deployment. |
| packageCache.configMap | string | `""` | The name of a ConfigMap to use as the package cache. Disables the default package cache `emptyDir` Volume. |
| packageCache.medium | string | `""` | Set to `Memory` to hold the package cache in a RAM backed file system. Useful for Crossplane development. |
| packageCache.pvc | string | `""` | The name of a PersistentVolumeClaim to use as the package cache. Disables the default package cache `emptyDir` Volume. |
| packageCache.sizeLimit | string | `"20Mi"` | The size limit for the package cache. If medium is `Memory` the `sizeLimit` can't exceed Node memory. |
| podSecurityContextCrossplane | object | `{}` | Add a custom `securityContext` to the Crossplane pod. |
| podSecurityContextRBACManager | object | `{}` | Add a custom `securityContext` to the RBAC Manager pod. |
| priorityClassName | string | `""` | The PriorityClass name to apply to the Crossplane and RBAC Manager pods. |
| provider.defaultActivations | list | `["*"]` | Define entries for the default managed resource activation policy. If defined, a default MRAP will contain these activations. |
| provider.packages | list | `[]` | A list of Provider packages to install. |
| rbac.clusterAdmin | bool | `false` |  |
| rbacManager.affinity | object | `{}` | Add `affinities` to the RBAC Manager pod deployment. |
| rbacManager.args | list | `[]` | Add custom arguments to the RBAC Manager pod. |
| rbacManager.deploy | bool | `true` | Deploy the RBAC Manager pod and its required roles. |
| rbacManager.leaderElection | bool | `true` | Enable [leader election](https://docs.crossplane.io/latest/guides/pods/#leader-election) for the RBAC Manager pod. |
| rbacManager.nodeSelector | object | `{}` | Add `nodeSelectors` to the RBAC Manager pod deployment. |
| rbacManager.replicas | int | `1` | The number of RBAC Manager pod `replicas` to deploy. |
| rbacManager.revisionHistoryLimit | string | `nil` | The number of RBAC Manager ReplicaSets to retain. |
| rbacManager.skipAggregatedClusterRoles | bool | `false` | Don't install aggregated Crossplane ClusterRoles. |
| rbacManager.tolerations | list | `[]` | Add `tolerations` to the RBAC Manager pod deployment. |
| rbacManager.topologySpreadConstraints | list | `[]` | Add `topologySpreadConstraints` to the RBAC Manager pod deployment. |
| readiness.port | string | `""` | The port the readyz server listens on. |
| registryCaBundleConfig.key | string | `""` | The ConfigMap key containing a custom CA bundle to enable fetching packages from registries with unknown or untrusted certificates. |
| registryCaBundleConfig.name | string | `""` | The ConfigMap name containing a custom CA bundle to enable fetching packages from registries with unknown or untrusted certificates. |
| replicas | int | `1` | The number of Crossplane pod `replicas` to deploy. |
| resourcesCrossplane.limits.cpu | string | `"500m"` | CPU resource limits for the Crossplane pod. |
| resourcesCrossplane.limits.memory | string | `"1024Mi"` | Memory resource limits for the Crossplane pod. |
| resourcesCrossplane.requests.cpu | string | `"100m"` | CPU resource requests for the Crossplane pod. |
| resourcesCrossplane.requests.memory | string | `"256Mi"` | Memory resource requests for the Crossplane pod. |
| resourcesRBACManager.limits.cpu | string | `"100m"` | CPU resource limits for the RBAC Manager pod. |
| resourcesRBACManager.limits.memory | string | `"512Mi"` | Memory resource limits for the RBAC Manager pod. |
| resourcesRBACManager.requests.cpu | string | `"100m"` | CPU resource requests for the RBAC Manager pod. |
| resourcesRBACManager.requests.memory | string | `"256Mi"` | Memory resource requests for the RBAC Manager pod. |
| revisionHistoryLimit | string | `nil` | The number of Crossplane ReplicaSets to retain. |
| runtimeClassName | string | `""` | The runtimeClassName name to apply to the Crossplane and RBAC Manager pods. |
| secrets.customAnnotations | object | `{}` | Add custom annotations to Crossplane Secret resources. |
| securityContextCrossplane.allowPrivilegeEscalation | bool | `false` | Enable `allowPrivilegeEscalation` for the Crossplane pod. |
| securityContextCrossplane.readOnlyRootFilesystem | bool | `true` | Set the Crossplane pod root file system as read-only. |
| securityContextCrossplane.runAsGroup | int | `65532` | The group ID used by the Crossplane pod. |
| securityContextCrossplane.runAsUser | int | `65532` | The user ID used by the Crossplane pod. |
| securityContextRBACManager.allowPrivilegeEscalation | bool | `false` | Enable `allowPrivilegeEscalation` for the RBAC Manager pod. |
| securityContextRBACManager.readOnlyRootFilesystem | bool | `true` | Set the RBAC Manager pod root file system as read-only. |
| securityContextRBACManager.runAsGroup | int | `65532` | The group ID used by the RBAC Manager pod. |
| securityContextRBACManager.runAsUser | int | `65532` | The user ID used by the RBAC Manager pod. |
| service.customAnnotations | object | `{}` | Configure annotations on the service object. Only enabled when webhooks.enabled = true |
| serviceAccount.create | bool | `true` | Specifies whether Crossplane ServiceAccount should be created |
| serviceAccount.customAnnotations | object | `{}` | Add custom `annotations` to the Crossplane ServiceAccount. |
| serviceAccount.name | string | `""` | Provide the name of an already created Crossplane ServiceAccount. Required when `serviceAccount.create` is `false` |
| sidecarsCrossplane | list | `[]` | Add sidecar containers to the Crossplane pod. Supports template expressions. |
| tolerations | list | `[]` | Add `tolerations` to the Crossplane pod deployment. |
| topologySpreadConstraints | list | `[]` | Add `topologySpreadConstraints` to the Crossplane pod deployment. |
| upbound.init.extraEnvVars | object | `{}` |  |
| upbound.manager.affinity | object | `{}` | Add `affinities` to the Upbound Controller Manager pod deployment. |
| upbound.manager.args | list | `[]` | Add custom arguments to the Upbound Controller Manager pod. |
| upbound.manager.backupCache.medium | string | `""` | Set to `Memory` to hold the backup cache in a RAM backed file system. |
| upbound.manager.backupCache.sizeLimit | string | `"20Mi"` | The size limit for the backup cache. If medium is `Memory` the `sizeLimit` can't exceed Node memory. |
| upbound.manager.customAnnotations | object | `{}` | Add custom `annotations` to the Upbound Controller Manager pod deployment. |
| upbound.manager.deploymentStrategy | string | `"RollingUpdate"` | The deployment strategy for the Upbound Controller Manager pod. |
| upbound.manager.dnsPolicy | string | `""` | Specify the `dnsPolicy` to be used by the Upbound Controller Manager pod. |
| upbound.manager.extraEnvVars | object | `{}` | Add custom environmental variables to the Upbound Controller Manager pod deployment. Replaces any `.` in a variable name with `_`. For example, `SAMPLE.KEY=value1` becomes `SAMPLE_KEY=value1`. |
| upbound.manager.extraVolumeMounts | object | `{}` | Add custom `volumeMounts` to the Upbound Controller Manager pod. |
| upbound.manager.extraVolumes | object | `{}` | Add custom `volumes` to the Upbound Controller Manager pod. |
| upbound.manager.image.pullPolicy | string | `"IfNotPresent"` | The Upbound Controller Manager image pull policy used for Crossplane and RBAC Manager pods. |
| upbound.manager.image.repository | string | `"xpkg.upbound.io/upbound/controller-manager"` | Repository for the Upbound Controller Manager pod image. |
| upbound.manager.image.tag | string | `""` | The Upbound Controller Manager image tag. Defaults to the value of `appVersion` in `Chart.yaml`. |
| upbound.manager.imagePullSecrets | list | `[]` | The imagePullSecret names to add to the Upbound Controller Manager ServiceAccount. |
| upbound.manager.initResources | object | `{}` | Resource requests and limits for the Upbound Controller Manager `initialize-crds` init container. |
| upbound.manager.leaderElection | bool | `true` | Enable [leader election](https://docs.crossplane.io/latest/concepts/pods/#leader-election) for the Upbound Controller Manager pod. |
| upbound.manager.measurement.enabled | bool | `true` | Enable the measurement server. |
| upbound.manager.measurement.port | string | `""` | The port the measurement server listens on. |
| upbound.manager.metering | object | `{"affinity":{},"args":[],"customAnnotations":{},"dnsPolicy":"","extraEnvVars":{},"extraVolumeMounts":[],"extraVolumes":[],"image":{"pullPolicy":"IfNotPresent","repository":"xpkg.upbound.io/upbound/controller-manager","tag":""},"imagePullSecrets":[],"meteringStorage":{"accessMode":"ReadWriteOnce","enabled":false,"size":"10Gi","storageClass":""},"nodeSelector":{},"podAnnotations":{},"podLabels":{},"podSecurityContext":{},"ports":[],"priorityClassName":"","resources":{"limits":{"cpu":"500m","memory":"1024Mi"},"requests":{"cpu":"50m","memory":"128Mi"}},"securityContext":{},"startupProbe":{},"tolerations":[],"topologySpreadConstraints":[]}` | Configuration for the UXP metering StatefulSet deployed by the licensing controller. |
| upbound.manager.metering.affinity | object | `{}` | Add `affinities` to the metering StatefulSet pods. |
| upbound.manager.metering.args | list | `[]` | Add custom arguments to the Upbound Metering pod. |
| upbound.manager.metering.customAnnotations | object | `{}` | Add custom `annotations` to the metering StatefulSet. |
| upbound.manager.metering.dnsPolicy | string | `""` | Specify the `dnsPolicy` to be used by the metering pod. |
| upbound.manager.metering.extraEnvVars | object | `{}` | Add custom environmental variables to the metering pod. Replaces any `.` in a variable name with `_`. For example, `SAMPLE.KEY=value1` becomes `SAMPLE_KEY=value1`. |
| upbound.manager.metering.extraVolumeMounts | list | `[]` | Add custom `volumeMounts` to the metering pod. |
| upbound.manager.metering.extraVolumes | list | `[]` | Add custom `volumes` to the metering pod. |
| upbound.manager.metering.image | object | `{"pullPolicy":"IfNotPresent","repository":"xpkg.upbound.io/upbound/controller-manager","tag":""}` | Container image for the metering StatefulSet. |
| upbound.manager.metering.image.pullPolicy | string | `"IfNotPresent"` | The Upbound Metering image pull policy. |
| upbound.manager.metering.image.repository | string | `"xpkg.upbound.io/upbound/controller-manager"` | Repository for the Upbound Metering pod image. |
| upbound.manager.metering.image.tag | string | `""` | The metering container image tag. Defaults to the value of `appVersion` in `Chart.yaml`. |
| upbound.manager.metering.imagePullSecrets | list | `[]` | The imagePullSecret names to add to the metering StatefulSet. |
| upbound.manager.metering.meteringStorage.accessMode | string | `"ReadWriteOnce"` | Access mode for the PersistentVolume. |
| upbound.manager.metering.meteringStorage.enabled | bool | `false` | Enable persistent storage for usage metering data. |
| upbound.manager.metering.meteringStorage.size | string | `"10Gi"` | Size of the PersistentVolume for metering data. |
| upbound.manager.metering.meteringStorage.storageClass | string | `""` | Storage class for the PersistentVolume. If not specified, uses the default storage class. |
| upbound.manager.metering.nodeSelector | object | `{}` | Add `nodeSelectors` to the metering StatefulSet pods. |
| upbound.manager.metering.podAnnotations | object | `{}` | Add custom annotations to the metering StatefulSet pods. |
| upbound.manager.metering.podLabels | object | `{}` | Add custom labels to the metering StatefulSet pods. |
| upbound.manager.metering.podSecurityContext | object | `{}` | Add a custom `securityContext` to the metering StatefulSet pod. |
| upbound.manager.metering.ports | list | `[]` | Configure ports for the metering container. |
| upbound.manager.metering.priorityClassName | string | `""` | The PriorityClass name to apply to the metering pod. |
| upbound.manager.metering.resources | object | `{"limits":{"cpu":"500m","memory":"1024Mi"},"requests":{"cpu":"50m","memory":"128Mi"}}` | Resource requirements for the metering container. |
| upbound.manager.metering.resources.limits.cpu | string | `"500m"` | CPU resource limits for the metering container. |
| upbound.manager.metering.resources.limits.memory | string | `"1024Mi"` | Memory resource limits for the metering container. |
| upbound.manager.metering.resources.requests.cpu | string | `"50m"` | CPU resource requests for the metering container. |
| upbound.manager.metering.resources.requests.memory | string | `"128Mi"` | Memory resource requests for the metering container. |
| upbound.manager.metering.securityContext | object | `{}` | Add a custom `securityContext` to the metering container. |
| upbound.manager.metering.startupProbe | object | `{}` | Configure startup probe for the metering container. |
| upbound.manager.metering.tolerations | list | `[]` | Add `tolerations` to the metering StatefulSet pods. |
| upbound.manager.metering.topologySpreadConstraints | list | `[]` | Add `topologySpreadConstraints` to the metering pod. |
| upbound.manager.metrics.enabled | bool | `false` | Enable Prometheus path, port and scrape annotations and expose port 8080 for the Upbound Controller Manager pod. |
| upbound.manager.metrics.port | string | `""` | The port the metrics server listens on. |
| upbound.manager.nodeSelector | object | `{}` | Add `nodeSelectors` to the Upbound Controller Manager pod deployment. |
| upbound.manager.packageCache.medium | string | `""` | Set to `Memory` to hold the package cache in a RAM backed file system. Useful for Crossplane development. |
| upbound.manager.packageCache.sizeLimit | string | `"20Mi"` | The size limit for the package cache. If medium is `Memory` the `sizeLimit` can't exceed Node memory. |
| upbound.manager.podSecurityContext | object | `{}` | Add a custom `securityContext` to the Upbound Controller Manager pod. |
| upbound.manager.priorityClassName | string | `""` | The PriorityClass name to apply to the Upbound Controller Manager pod. |
| upbound.manager.prometheus | object | `{"disabled":false,"image":{"repository":"quay.io/prometheus/prometheus","tag":"v3.2.1"},"metricAllowlist":"controller_runtime_reconcile_total|upjet_resource_external_api_calls_total|function_run_function_seconds_.+","queryTimeout":"2m","resources":{"limits":{"cpu":"500m","memory":"512Mi"},"requests":{"cpu":"50m","memory":"256Mi"}},"retention":"12h","storage":{"accessMode":"ReadWriteOnce","size":"5Gi","storageClass":""}}` | Configuration for the UXP Prometheus instance deployed used for the webui metric dashboards. |
| upbound.manager.prometheus.disabled | bool | `false` | Set to true to disable the Prometheus deployment entirely. |
| upbound.manager.prometheus.image.repository | string | `"quay.io/prometheus/prometheus"` | Repository for the Prometheus image. |
| upbound.manager.prometheus.image.tag | string | `"v3.2.1"` | The Prometheus image tag. |
| upbound.manager.prometheus.metricAllowlist | string | `"controller_runtime_reconcile_total|upjet_resource_external_api_calls_total|function_run_function_seconds_.+"` | Regex allowlist for metrics to keep. Only matching metric names are ingested; everything else is dropped at scrape time. |
| upbound.manager.prometheus.queryTimeout | string | `"2m"` | Prometheus query timeout. |
| upbound.manager.prometheus.resources.limits.cpu | string | `"500m"` | CPU resource limits for Prometheus. |
| upbound.manager.prometheus.resources.limits.memory | string | `"512Mi"` | Memory resource limits for Prometheus. |
| upbound.manager.prometheus.resources.requests.cpu | string | `"50m"` | CPU resource requests for Prometheus. |
| upbound.manager.prometheus.resources.requests.memory | string | `"256Mi"` | Memory resource requests for Prometheus. |
| upbound.manager.prometheus.retention | string | `"12h"` | Prometheus data retention period. |
| upbound.manager.prometheus.storage.accessMode | string | `"ReadWriteOnce"` | Access mode for the PersistentVolume. |
| upbound.manager.prometheus.storage.size | string | `"5Gi"` | Size of the PersistentVolume for Prometheus data. |
| upbound.manager.prometheus.storage.storageClass | string | `""` | Storage class for the PersistentVolume. If not specified, uses the default storage class. |
| upbound.manager.readiness.port | string | `""` | The port the readyz server listens on. |
| upbound.manager.replicas | int | `1` | The number of Upbound Controller Manager pod `replicas` to deploy. |
| upbound.manager.resources.limits.cpu | string | `"500m"` | CPU resource limits for the Upbound Controller Manager pod. |
| upbound.manager.resources.limits.memory | string | `"512Mi"` | Memory resource limits for the Upbound Controller Manager pod. |
| upbound.manager.resources.requests.cpu | string | `"50m"` | CPU resource requests for the Upbound Controller Manager pod. |
| upbound.manager.resources.requests.memory | string | `"128Mi"` | Memory resource requests for the Upbound Controller Manager pod. |
| upbound.manager.revisionHistoryLimit | string | `nil` | The number of Upbound Controller Manager ReplicaSets to retain. |
| upbound.manager.securityContext.allowPrivilegeEscalation | bool | `false` | Enable `allowPrivilegeEscalation` for the Upbound Controller Manager pod. |
| upbound.manager.securityContext.readOnlyRootFilesystem | bool | `true` | Set the Upbound Controller Manager pod root file system as read-only. |
| upbound.manager.securityContext.runAsGroup | int | `65532` | The group ID used by the Upbound Controller Manager pod. |
| upbound.manager.securityContext.runAsUser | int | `65532` | The user ID used by the Upbound Controller Manager pod. |
| upbound.manager.tolerations | list | `[]` | Add `tolerations` to the Upbound Controller Manager pod deployment. |
| upbound.manager.topologySpreadConstraints | list | `[]` | Add `topologySpreadConstraints` to the Upbound Controller Manager pod deployment. |
| upbound.secretsProxy.apiServerSecretSuffixes | string | `"-tls-client,-tls-server,-root-ca"` | Comma-separated list of suffixes. Secrets with names containing any of these suffixes will be sent directly to the API server instead of the secrets proxy. |
| upbound.secretsProxy.caInit.resources | object | `{}` | Resource requests and limits for the `ca-init` init container (only deployed when `secretsProxy.enabled` is true). |
| upbound.secretsProxy.caSecretName | string | `"secrets-proxy-ca"` | Name of the CA secret to create. |
| upbound.secretsProxy.certSecretName | string | `"secrets-proxy-certs"` | Name of the certificate secret to create. |
| upbound.secretsProxy.enabled | bool | `false` | Enable secrets proxy CA initialization and webhook. |
| upbound.secretsProxy.leafSecretName | string | `"secrets-proxy-leaf"` | Name of the shared sidecar leaf certificate secret. Populated by ca-init and read by the webhook. |
| upbound.secretsProxy.webhook.additionalNamespaces | list | `[]` | Additional namespaces where the webhook should inject sidecars. The release namespace is always included. |
| upbound.secretsProxy.webhook.failurePolicy | string | `"Fail"` | Failure policy for the webhook (Ignore or Fail). |
| upbound.secretsProxy.webhook.timeoutSeconds | int | `10` | Timeout in seconds for the webhook. |
| upbound.secretsProxy.webhookSecretName | string | `"secrets-proxy-webhook-tls"` | Name of the webhook certificate secret to create. |
| upbound.secretsProxy.webhookServiceName | string | `"secrets-proxy-webhook"` | Name of the webhook service. |
| upbound.security.fips.enabled | bool | `false` | Disable FIPS strict mode by default. |
| upbound.telemetry.disabled | bool | `false` | Disable telemetry. |
| webhooks.enabled | bool | `true` | Enable webhooks for Crossplane and installed Provider packages. |
| webhooks.port | string | `""` | The port the webhook server listens on. |
| webui.affinity | object | `{}` | Add `affinities` to the webui pod deployment. |
| webui.config.controlPlaneName | string | `""` |  |
| webui.config.metricsApiEndpoint | string | `"http://uxp-prometheus.crossplane-system.svc.cluster.local:9090/api/v1"` | The Prometheus API endpoint used by the Web UI for metrics. Override this when using an external Prometheus instance and disable the built-in Prometheus (`upbound.manager.prometheus.disabled: true`). |
| webui.config.queryApiEndpoint | string | `"http://spaces-apollo.crossplane-system.svc.cluster.local:8080/apis/query.spaces.upbound.io/v1alpha2/namespaces/default/queries"` |  |
| webui.enabled | bool | `true` | Enable the UXP Web UI and Apollo subcharts. |
| webui.image.pullPolicy | string | `"Always"` |  |
| webui.image.repository | string | `"xpkg.upbound.io/upbound/uxp-webui-nginx"` |  |
| webui.image.tag | string | `""` |  |
| webui.imagePullSecrets | list | `[]` |  |
| webui.nodeSelector | object | `{}` | Add `nodeSelectors` to the webui pod deployment. |
| webui.probes.liveness.failureThreshold | int | `3` |  |
| webui.probes.liveness.initialDelaySeconds | int | `30` |  |
| webui.probes.liveness.periodSeconds | int | `10` |  |
| webui.probes.liveness.timeoutSeconds | int | `5` |  |
| webui.probes.readiness.failureThreshold | int | `3` |  |
| webui.probes.readiness.initialDelaySeconds | int | `5` |  |
| webui.probes.readiness.periodSeconds | int | `5` |  |
| webui.probes.readiness.timeoutSeconds | int | `3` |  |
| webui.replicas | int | `1` |  |
| webui.resources.limits.cpu | string | `"100m"` |  |
| webui.resources.limits.memory | string | `"64Mi"` |  |
| webui.resources.requests.cpu | string | `"50m"` |  |
| webui.resources.requests.memory | string | `"32Mi"` |  |
| webui.service.port | int | `80` |  |
| webui.service.type | string | `"ClusterIP"` |  |
| webui.tolerations | list | `[]` | Add `tolerations` to the webui pod deployment. |
| webui.topologySpreadConstraints | list | `[]` | Add `topologySpreadConstraints` to the webui pod deployment. |
</div>

<!-- vale on -->

<!-- end-table-no -->
