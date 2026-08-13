---
title: Spaces Helm Chart Reference
sidebar_position: 21
description: Spaces Helm chart configuration values
mdx:
    format: md
---

<!-- vale off -->

This reference provides detailed documentation on the Upbound Space Helm chart. This Helm chart contains configuration values for installation, configuration, and management of an Upbound Space deployment.

## Requirements

| Repository | Name | Version |
|------------|------|---------|
| oci://xpkg.upbound.io/spaces-artifacts | apollo(uxp-apollo) | 0.4.20 |

## Values

<div class="helm-table">

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| account | string | `"notdemo"` | The Upbound organization this installation is associated with. |
| api.allowedNamespaceAnnotations | list | `["kubectl.kubernetes.io/last-applied-configuration"]` | Allowed namespace annotations for namespaces(groups) managed through the spaces API. |
| api.extraVolumes | list | `[]` | Additional volumes to be added to the API pods. |
| api.hpa.enabled | bool | `false` | This enables the Horizontal Pod Autoscaler for the api deployment. |
| api.hpa.maxReplicas | int | `5` | The maximum number of replicas for the Horizontal Pod Autoscaler. |
| api.hpa.minReplicas | int | `1` | The minimum number of replicas for the Horizontal Pod Autoscaler. |
| api.hpa.targetCPUUtilizationPercentage | int | `80` | The target CPU utilization percentage for the Horizontal Pod Autoscaler. |
| api.hpa.targetMemoryUtilizationPercentage | int | `80` | The target memory utilization percentage for the Horizontal Pod Autoscaler. |
| api.insecure | bool | `false` | Disable TLS at the endpoints |
| api.podAnnotations | object | `{}` | Annotations to be added to the API pods. |
| api.podLabels | object | `{}` | Labels to be added to the API pods. |
| api.podSecurityContext | object | `{}` | Pod security context for the API pods. |
| api.prometheus.podMonitor.enabled | bool | `false` | This enables the PodMonitor for the spaces API deployment. |
| api.prometheus.podMonitor.interval | string | `"30s"` | The interval at which the PodMonitor scrapes metrics. |
| api.proxy.command | list | `[]` | Command to run for the API proxy container. |
| api.proxy.extraArgs | list | `[]` | Additional arguments to pass to the API proxy container. |
| api.proxy.extraEnv | list | `[]` | Additional environment variables to pass to the API proxy container. |
| api.proxy.extraVolumeMounts | list | `[]` | Additional volume mounts to pass to the API proxy container. |
| api.proxy.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy for the API proxy container image. |
| api.proxy.image.repository | string | `"hyperspace"` | Repository for the API proxy container image. |
| api.proxy.image.tag | string | `""` | Tag for the API proxy container image. |
| api.proxy.resources.limits.cpu | string | `"1000m"` | CPU limit for the API proxy container. |
| api.proxy.resources.limits.memory | string | `"200Mi"` | Memory limit for the API proxy container. |
| api.proxy.resources.requests.cpu | string | `"100m"` | CPU request for the API proxy container. |
| api.proxy.resources.requests.memory | string | `"50Mi"` | Memory request for the API proxy container. |
| api.proxy.service.api.port | int | `8443` | Port for the API proxy API service. |
| api.proxy.service.metrics.port | int | `8085` | Port for the API proxy metrics service. |
| api.proxy.service.type | string | `"ClusterIP"` | Type for the API proxy service. |
| api.replicaCount | int | `1` | Number of replicas for the spaces API deployment. |
| api.secretRefs.tlsSecretName | string | `"spaces-api-cert"` | Name of the secret containing the TLS Certificate for the API. |
| api.secretRefs.tokenSigning | string | `"cert-token-signing-gateway"` | Name of the secret containing the Certificate Authority for the spaces API, used to sign tokens for control plane kubeconfigs. |
| api.serviceAccount.annotations | object | `{}` | Annotations to be added to the service account used by the spaces API deployment. |
| api.serviceAccount.create | bool | `true` | Whether to create a service account for the spaces API deployment. |
| api.serviceAccount.name | string | `"mxe-api"` | Name of the service account used by the spaces API deployment. |
| apollo.apollo.apiserver.service.admin.port | int | `8444` |  |
| apollo.apollo.apiserver.service.api.port | int | `8443` |  |
| apollo.apollo.mode.deploymentMode | string | `"multi-tenant"` |  |
| apollo.apollo.observability.enabled | bool | `false` |  |
| apollo.apollo.observability.tracing.enabled | bool | `false` |  |
| apollo.apollo.observability.tracing.endpoint | string | `"telemetry-spaces-collector.upbound-system.svc.cluster.local"` |  |
| apollo.apollo.observability.tracing.insecure | bool | `false` |  |
| apollo.apollo.observability.tracing.port | int | `4317` |  |
| apollo.apollo.observability.tracing.sampling.rate | float | `0.1` |  |
| apollo.apollo.observability.tracing.serviceName | string | `"spaces-apollo"` |  |
| apollo.apollo.observability.tracing.tls.caBundleSecretRef | string | `"spaces-ca-bundle"` |  |
| apollo.apollo.podLabels | object | `{}` | Labels to be added to the apollo apiserver pods. These pods are not covered by `space.labels`; set this to label them. |
| apollo.apollo.priorityClassName | string | `"spaces-system-high-priority"` |  |
| apollo.apollo.secretRefs.spacesCa.key | string | `"ca-bundle.pem"` |  |
| apollo.apollo.secretRefs.spacesCa.name | string | `"spaces-ca-bundle"` |  |
| apollo.apollo.storage.postgres.create | bool | `true` |  |
| apollo.apollo.storage.postgres.sidecar | bool | `false` |  |
| apollo.apollo.syncer.enabled | bool | `false` |  |
| apollo.apollo.syncer.image.tag | string | `"v0.4.20"` |  |
| apollo.registry | string | `"xpkg.upbound.io/spaces-artifacts"` |  |
| authentication.hubIdentities | bool | `true` | This enables respecting built in Kubernetes identities (clientcertificate, managed kubernetes OIDC, Kubernetes Groups, etc) specified within the Connected Space's hub. |
| authentication.structuredConfig | string | `""` | Enables consumption of JWT Authenticators via Authentication Configuration per https://kubernetes.io/docs/reference/access-authn-authz/authentication/#using-authentication-configuration <br> The below property takes the name of a configmap that contains a structured authentication configuration. |
| authorization.hubRBAC | bool | `true` | This enables respecting built in Kubernetes Roles and RoleBindings for the resources included in the Space's installation. |
| billing.enabled | bool | `false` | Enables the legacy loop-based billing pipeline (KSM + Vector). |
| billing.storage.aws.bucket | string | `""` | AWS bucket name. See billing.storage.secretRef for authentication. Required if billing.storage.provider=aws. |
| billing.storage.aws.endpoint | string | `""` | AWS endpoint. |
| billing.storage.aws.region | string | `""` | AWS region. Required if billing.storage.provider=aws. |
| billing.storage.aws.tls."ca.crt" | bool | `false` | See billing.storage.secretRef.<br> Set to true if the corresponding key is defined in the secret referenced by billing.storage.secretRef.name. |
| billing.storage.aws.tls."tls.crt" | bool | `false` | See billing.storage.secretRef.<br> Set to true if the corresponding key is defined in the secret referenced by billing.storage.secretRef.name. |
| billing.storage.aws.tls."tls.key" | bool | `false` | See billing.storage.secretRef.<br> Set to true if the corresponding key is defined in the secret referenced by billing.storage.secretRef.name. |
| billing.storage.aws.tls.alpnProtocols | list | `[]` | List of Application Layer Protocol Negotiation (ALPN) to use for the AWS endpoint. |
| billing.storage.aws.tls.verifyCertificate | bool | `true` | Whether to verify the certificate for the AWS endpoint. |
| billing.storage.aws.tls.verifyHostname | bool | `true` | Whether to verify the hostname for the AWS endpoint. |
| billing.storage.azure.connectionString | string | `""` | Connection string for the Azure storage account. |
| billing.storage.azure.container | string | `""` | Azure container name. Required if billing.storage.provider=azure. |
| billing.storage.azure.endpoint | string | `""` | Azure endpoint. |
| billing.storage.azure.storageAccount | string | `""` | Azure storage account name. |
| billing.storage.gcp.bucket | string | `""` | GCP gcs bucket name. Required if billing.storage.provider=gcp. |
| billing.storage.gcp.tls."ca.crt" | bool | `false` | See billing.storage.secretRef. <br> Set to true if the corresponding key is defined in the secret referenced by billing.storage.secretRef.name. |
| billing.storage.gcp.tls."tls.crt" | bool | `false` | See billing.storage.secretRef. <br> Set to true if the corresponding key is defined in the secret referenced by billing.storage.secretRef.name. |
| billing.storage.gcp.tls."tls.key" | bool | `false` | See billing.storage.secretRef. <br> Set to true if the corresponding key is defined in the secret referenced by billing.storage.secretRef.name. |
| billing.storage.gcp.tls.alpnProtocols | list | `[]` | Application Layer Protocol Negotiation (ALPN) to use for the GCP endpoint. |
| billing.storage.gcp.tls.verifyCertificate | bool | `true` | Whether to verify the certificate for the GCP endpoint. |
| billing.storage.gcp.tls.verifyHostname | bool | `true` | Whether to verify the hostname for the GCP endpoint. |
| billing.storage.provider | string | `""` | The provider for the billing storage. Required if billing.enabled=true. Must be one of aws, gcp, azure |
| billing.storage.secretRef.name | string | `"billing-storage"` | Set to the empty string in order to use a workload identity for the billing feature. If you are configuring the billing feature with static credentials for accessing the cloud object storage, then the secret may contain any of these keys for configuring authentication: <br> AWS_ACCESS_KEY_ID: AWS access key ID. Used when provider is aws. <br> AWS_SECRET_ACCESS_KEY: AWS secret access key. Used when provider is aws. <br> AZURE_TENANT_ID: Azure tenant ID. Used when provider is azure. <br> AZURE_CLIENT_ID: Azure client ID. Used when provider is azure. <br> AZURE_CLIENT_SECRET: Azure client secret. Used when provider is azure. <br> AZURE_USERNAME: Azure username. Used when provider is azure. <br> AZURE_PASSWORD: Azure username. Used when provider is azure. <br> google_application_credentials: GCP service account key JSON. Used when provider is gcp. <br> The secret may also contain any of the following keys for configuring TLS. The corresponding value at billing.storage.<provider>.tls.<key> must also be set to true. <br> "ca.crt": Custom CA certificate. Used when provider is aws or gcp. <br> "tls.crt": Custom TLS certificate. Used when provider is aws or gcp. <br> "tls.key": Custom TLS key. Used when provider is aws or gcp. |
| certificates | object | `{"clusterResourceNamespace":"cert-manager","manageIssuers":true,"provision":true,"space":{"clusterIssuer":"spaces-selfsigned"},"spacesCA":{"duration":"8760h0m0s"},"spacesControllerWebhook":{"duration":"2160h0m0s"}}` | Given cert-manager is a requirement for installation, certificates specifies the general configurations for the certificates required for the installation to function. |
| certificates.clusterResourceNamespace | string | `"cert-manager"` | Specifies the cluster resource namespace for the cert-manager installation. <br> https://cert-manager.io/docs/configuration/#cluster-resource-namespace |
| certificates.manageIssuers | bool | `true` | When true (default), the chart creates the cert-manager Issuer and ClusterIssuer resources it needs. Set to false to suppress all chart-created issuers and use a pre-existing ClusterIssuer (specified via certificates.space.clusterIssuer) for every certificate. |
| certificates.provision | bool | `true` | Specifies if the chart should provision the certificate resources included in this chart. Operators can opt to provision their own certificates instead, however care should be made to ensure the certificates match the expected: <br> * Shared Certificate Authority <br> * Algorithm. (ECDSA) |
| certificates.space.clusterIssuer | string | `"spaces-selfsigned"` | The clusterIssuer for the space. Most certificates used at the space level are derived from this issuer. |
| connect | object | `{"agent":{"podLabels":{}}}` | Configurations for requests coming into the space via the connect agent. |
| connect.agent | object | `{"podLabels":{}}` | Connect agent related configurations. |
| connect.agent.podLabels | object | `{}` | Labels that are defined on the connect agent pod. Default value is:<br> app: agent |
| controlPlanes.container.mxpCharts.pullPolicy | string | `"IfNotPresent"` | Image pull policy for the mxp-charts container image. |
| controlPlanes.container.mxpCharts.repository | string | `"mxp-charts"` | Repository for the mxp-charts container image. |
| controlPlanes.container.mxpCharts.resources | object | `{}` | Resource requests and limits for the spaces internal charts container. |
| controlPlanes.container.mxpCharts.tag | string | `""` | Tag for the mxp-charts container image. |
| controlPlanes.container.mxpKsmConfig.pullPolicy | string | `"IfNotPresent"` | Image pull policy for the mxp controller container image. |
| controlPlanes.container.mxpKsmConfig.repository | string | `"hyperspace"` | Repository for the mxp controller container image. |
| controlPlanes.container.mxpKsmConfig.tag | string | `""` | Tag for the mxp controller container image. |
| controlPlanes.coredns.resources.limits.cpu | string | `"50m"` | CPU limit for the spaces control plane CoreDNS pod. |
| controlPlanes.coredns.resources.limits.memory | string | `"50Mi"` | Memory limit for the spaces control plane CoreDNS pod. |
| controlPlanes.coredns.resources.requests.cpu | string | `"10m"` | CPU request for the spaces control plane CoreDNS pod. |
| controlPlanes.coredns.resources.requests.memory | string | `"25Mi"` | Memory request for the spaces control plane CoreDNS pod. |
| controlPlanes.etcd.affinity | object | `{}` | Configure [affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity) rules for vcluster etcd Pods. |
| controlPlanes.etcd.defrag.resources.limits.cpu | string | `nil` | CPU limit for the spaces control plane etcd-defrag pod. |
| controlPlanes.etcd.defrag.resources.limits.memory | string | `nil` | Memory limit for the spaces control plane etcd-defrag pod. |
| controlPlanes.etcd.defrag.resources.requests.cpu | string | `nil` | CPU request for the spaces control plane etcd-defrag pod. |
| controlPlanes.etcd.defrag.resources.requests.memory | string | `nil` | Memory request for the spaces control plane etcd-defrag pod. |
| controlPlanes.etcd.persistence.size | string | `"5Gi"` | Size of the control plane's etcd PVCs. |
| controlPlanes.etcd.persistence.storageClassName | string | `""` | StorageClass name for control plane's etcd PVCs. |
| controlPlanes.etcd.resources.limits.cpu | string | `nil` | CPU limit for the spaces control plane etcd pod. |
| controlPlanes.etcd.resources.limits.memory | string | `nil` | Memory limit for the spaces control plane etcd pod. |
| controlPlanes.etcd.resources.requests.cpu | string | `"170m"` | CPU request for the spaces control plane etcd pod. |
| controlPlanes.etcd.resources.requests.memory | string | `"350Mi"` | Memory request for the spaces control plane etcd pod. |
| controlPlanes.etcd.tolerations | list | `[]` | Tolerations for vcluster etcd Pods. |
| controlPlanes.gateway.podAnnotations | object | `{}` | Annotations to be added to the control plane gateway pods. |
| controlPlanes.gateway.podLabels | object | `{}` | Labels to be added to the control plane gateway pods. |
| controlPlanes.gateway.port | int | `8443` | Port for the control plane gateway service. |
| controlPlanes.gateway.resources.limits | object | `{"cpu":null,"memory":null}` | Limits for the spaces control plane gateway pod. |
| controlPlanes.gateway.resources.limits.cpu | string | `nil` | CPU limit for the spaces control plane gateway pod. |
| controlPlanes.gateway.resources.limits.memory | string | `nil` | Memory limit for the spaces control plane gateway pod. |
| controlPlanes.gateway.resources.requests.cpu | string | `"10m"` | CPU request for the spaces control plane gateway pod. |
| controlPlanes.gateway.resources.requests.memory | string | `"25Mi"` | Memory request for the spaces control plane gateway pod. |
| controlPlanes.ha.enabled | bool | `false` | This enables the High Availability (HA) feature for the spaces control planes. Resulting in various control planes components being deployed in ha mode for all control planes. |
| controlPlanes.imagePullSecrets | list | `[]` | Optional image pull secret in upbound-system namespace to be used with an authenticated registry when pulling images for workloads in the virtual clusters of ControlPlanes. If not specified, the default behavior of propagating the optional secret specified in .imagePullSecrets down to the ControlPlanes is preserved. The specified secret in upbound-system namespace will be propagated with the name upbound-system-pull-secret into the virtual cluster. NOTE: only one image pull secret is currently supported. |
| controlPlanes.k8sVersion | string | `"v1.32.13"` |  |
| controlPlanes.kubeStateMetrics.resources.limits.cpu | string | `nil` | CPU limit for the spaces control plane kube-state-metrics pod. |
| controlPlanes.kubeStateMetrics.resources.limits.memory | string | `nil` | Memory limit for the spaces control plane kube-state-metrics pod. |
| controlPlanes.kubeStateMetrics.resources.requests.cpu | string | `"100m"` | CPU request for the spaces control plane kube-state-metrics pod. |
| controlPlanes.kubeStateMetrics.resources.requests.memory | string | `"50Mi"` | Memory request for the spaces control plane kube-state-metrics pod. |
| controlPlanes.mxpController.affinity | object | `{}` | Configure [affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity) rules for mxp-controller Pods. |
| controlPlanes.mxpController.apisInitResources.limits.cpu | string | `nil` | DEPRECATED, ignored, removed in 1.19. CPU limit for the mxp-controller apis-init initContainer. |
| controlPlanes.mxpController.apisInitResources.limits.memory | string | `nil` | DEPRECATED, ignored, removed in 1.19. Memory limit for the mxp-controller apis-init initContainer. |
| controlPlanes.mxpController.apisInitResources.requests.cpu | string | `nil` | DEPRECATED, ignored, removed in 1.19. CPU request for the mxp-controller apis-init initContainer. |
| controlPlanes.mxpController.apisInitResources.requests.memory | string | `nil` | DEPRECATED, ignored, removed in 1.19. Memory request for the mxp-controller apis-init initContainer. |
| controlPlanes.mxpController.command | list | `[]` | The command to run for the mxp controller. |
| controlPlanes.mxpController.debug | bool | `false` | Whether mxp-controller syncers should be deployed in debug mode. |
| controlPlanes.mxpController.pod.customLabels | object | `{}` | Custom labels to be added to the mxp-controller pod. |
| controlPlanes.mxpController.registryOverride | string | `""` | Override the default package registry for Upbound packages. |
| controlPlanes.mxpController.serviceAccount.annotations | object | `{}` | Custom annotations to be added to the service account for the mxp-controller deployment. |
| controlPlanes.mxpController.tolerations | list | `[]` | Tolerations for mxp-controller Pods. |
| controlPlanes.mxpKSMConfig.resources.limits.cpu | string | `nil` | CPU limit for the spaces control plane controller. |
| controlPlanes.mxpKSMConfig.resources.limits.memory | string | `nil` | Memory limit for the spaces control plane controller. |
| controlPlanes.mxpKSMConfig.resources.requests.cpu | string | `"100m"` | CPU request for the spaces control plane controller. |
| controlPlanes.mxpKSMConfig.resources.requests.memory | string | `"50Mi"` | Memory request for the spaces control plane controller. |
| controlPlanes.policies.limitRange.default.memory | string | `nil` | Default memory limit applied to control plane containers that do not set one. Unset by default. |
| controlPlanes.policies.limitRange.enabled | bool | `true` | Whether to deploy default LimitRange policies for the control planes. |
| controlPlanes.sharedSecrets.pod.customLabels | object | `{}` | Custom labels to be added to the external-secrets-operator pod in the ControlPlane host namespace. |
| controlPlanes.sharedSecrets.resources.limits.cpu | string | `nil` | CPU limit for the external-secrets-operator pod. |
| controlPlanes.sharedSecrets.resources.limits.memory | string | `nil` | Memory limit for the external-secrets-operator pod. |
| controlPlanes.sharedSecrets.resources.requests.cpu | string | `"10m"` | CPU request for the external-secrets-operator pod. |
| controlPlanes.sharedSecrets.resources.requests.memory | string | `"50Mi"` | Memory request for the external-secrets-operator pod. |
| controlPlanes.sharedSecrets.serviceAccount.customAnnotations | object | `{}` | Custom annotations to be added to the service account for the external-secrets-operator deployment. |
| controlPlanes.uxp.crossplane.affinity | object | `{}` | Configure [affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity) rules for Crossplane core Pods. |
| controlPlanes.uxp.crossplane.tolerations | list | `[]` | Tolerations for Crossplane core Pods. |
| controlPlanes.uxp.disableDefaultManagedResourceActivationPolicy | bool | `false` | This disables the default managed resource activation policy, will only affect v2 Control Planes |
| controlPlanes.uxp.disableRealtimeCompositions | bool | `true` | This disables realtime compositions. |
| controlPlanes.uxp.enableAddons | bool | `false` | This enables the Addons feature for UXP, will only affect v2 Control Planes. |
| controlPlanes.uxp.enableCompositionFunctions | bool | `true` | This enables Composition Functions. |
| controlPlanes.uxp.enableDependencyVersionUpgrades | bool | `false` | This enables dependency version upgrades for Crossplane packages. |
| controlPlanes.uxp.enableEnvironmentConfigs | bool | `true` | This enables EnvironmentConfigs. |
| controlPlanes.uxp.enableProviderIdentity | bool | `false` | This enables the provider identity feature. |
| controlPlanes.uxp.enableSSAClaims | bool | `false` | This enables the server-side apply for claims. |
| controlPlanes.uxp.enableSignatureVerification | bool | `false` | This enables Crossplane Packages signature verification. |
| controlPlanes.uxp.enableUsages | bool | `true` | This enables Usages. |
| controlPlanes.uxp.metrics.enabled | bool | `true` | This enables the metrics endpoints UXP. |
| controlPlanes.uxp.rbacManager.affinity | object | `{}` | Configure [affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity) rules for RBAC Manager Pods. |
| controlPlanes.uxp.rbacManager.tolerations | list | `[]` | Tolerations for RBAC Manager Pods. |
| controlPlanes.uxp.registryOverride | string | `""` | Override the default package registry for Crossplane images. |
| controlPlanes.uxp.resourcesCrossplane.limits.cpu | string | `nil` | CPU limit for the spaces control plane UXP pod. |
| controlPlanes.uxp.resourcesCrossplane.limits.memory | string | `nil` | Memory limit for the spaces control plane UXP pod. |
| controlPlanes.uxp.resourcesCrossplane.requests.cpu | string | `"370m"` | CPU request for the spaces control plane UXP pod. |
| controlPlanes.uxp.resourcesCrossplane.requests.memory | string | `"400Mi"` | Memory request for the spaces control plane UXP pod. |
| controlPlanes.uxp.resourcesRBACManager.limits.cpu | string | `"50m"` | CPU limit for the spaces control plane UXP RBAC Manager pod. |
| controlPlanes.uxp.resourcesRBACManager.limits.memory | string | `"300Mi"` | Memory limit for the spaces control plane UXP RBAC Manager pod. |
| controlPlanes.uxp.resourcesRBACManager.requests.cpu | string | `"25m"` | CPU request for the spaces control plane UXP RBAC Manager pod. |
| controlPlanes.uxp.resourcesRBACManager.requests.memory | string | `"256Mi"` | Memory request for the spaces control plane UXP RBAC Manager pod. |
| controlPlanes.uxp.serviceAccount.customAnnotations | object | `{}` | Custom annotations to be added to the service account for the UXP deployment. |
| controlPlanes.uxp.v2.controllerManager.affinity | object | `{}` | Configure [affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity) rules for the upbound controller-manager Pod (v2 only). |
| controlPlanes.uxp.v2.controllerManager.tolerations | list | `[]` | Tolerations for the upbound controller-manager Pod (v2 only). |
| controlPlanes.uxp.v2.controllerManagerRepository | string | `""` |  |
| controlPlanes.uxp.v2.controllerManagerTag | string | `""` |  |
| controlPlanes.uxp.v2.enabled | bool | `true` | Whether users should be able to create ControlPlanes with the v2 UXP. |
| controlPlanes.vcluster.affinity | object | `{}` | Configure [affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity) rules for vcluster Pods. |
| controlPlanes.vcluster.extraSyncLabels | string | `""` | Extra pod labels to be synced by the vcluster. This is a string consisting of a comma-separated list of label keys. |
| controlPlanes.vcluster.probes.livenessProbe.enabled | bool | `true` | Whether to enable the liveness probe on the syncer pod. |
| controlPlanes.vcluster.resources.limits.cpu | string | `"3000m"` | CPU limit for the spaces control plane vcluster pod. |
| controlPlanes.vcluster.resources.requests.cpu | string | `"170m"` | CPU request for the spaces control plane vcluster pod. |
| controlPlanes.vcluster.resources.requests.memory | string | `"1320Mi"` | Memory request for the spaces control plane vcluster pod. This is the initial memory request for the control plane pod. The memory request of the vcluster pod may be dynamically adjusted by the autoscaler controller based on the number of CRDs. |
| controlPlanes.vcluster.sync.toHost.serviceAccounts | bool | `true` | Whether to sync service accounts from vcluster to the host cluster. |
| controlPlanes.vcluster.tolerations | list | `[]` | Tolerations for vcluster Pods. |
| controlPlanes.vector.affinity | object | `{}` | Configure [affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity) rules for Vector Pods. |
| controlPlanes.vector.debug | bool | `false` | This enables debug mode for Vector. |
| controlPlanes.vector.nodeSelector | object | `{}` | Configure a [nodeSelector](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#nodeselector) for Vector Pods. |
| controlPlanes.vector.persistence.enabled | bool | `false` | Set enabled to true to run Vector as a statefulset with each replica backed by a persistent volume and enable disk buffers for selected sinks. When set to false, Vector is run as a deployment with memory buffers. |
| controlPlanes.vector.persistence.size | string | `"1Gi"` | Size must be at least the sum of all buffer.maxSize values with overhead for other Vector data. If you define this you should also define all sink buffer.maxSize values. |
| controlPlanes.vector.persistence.storageClassName | string | `""` | StorageClass name to be used for Vector's PVCs. |
| controlPlanes.vector.pod.customLabels | object | `{}` | Custom labels to be added to the vector pod. |
| controlPlanes.vector.replicas | int | `1` | Number of replicas for the Vector deployment. |
| controlPlanes.vector.resources.limits.cpu | string | `nil` | CPU limit for the spaces control plane Vector pod. |
| controlPlanes.vector.resources.limits.memory | string | `nil` | Memory limit for the spaces control plane Vector pod. |
| controlPlanes.vector.resources.requests.cpu | string | `"200m"` | CPU request for the spaces control plane Vector pod. |
| controlPlanes.vector.resources.requests.memory | string | `"256Mi"` | Memory request for the spaces control plane Vector pod. |
| controlPlanes.vector.service.enabled | bool | `false` | Whether to expose the Vector service. |
| controlPlanes.vector.serviceAccount.customAnnotations | object | `{}` | Custom annotations to be added to the service account for the Vector deployment. |
| controlPlanes.vector.sinks.usage.buffer.maxEvents | int | `500` | String containing max number of events to buffer in memory. <br> Relevant when mxp.vector.persistence.enabled=false. |
| controlPlanes.vector.sinks.usage.buffer.maxSize | int | `268435488` | String containing max size of disk buffer in bytes. Must fit with other buffer.maxSize values in mxp.vector.persistence.size. <br> Relevant when mxp.vector.persistence.enabled=true.<br> ~256 MiB, minimum allowed |
| controlPlanes.vector.tolerations | list | `[]` | Configure Vector Pods to be scheduled on [tainted](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) nodes. |
| controlPlanes.vector.topologySpreadConstraints | list | `[]` | Configure [topology spread constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints) for Vector Pods. Valid for the "Aggregator" and "Stateless-Aggregator" roles. |
| controlPlanes.vector.version | string | `"0.36.1"` | Version of Vector to deploy. |
| controller.controller.command | list | `[]` | The command to run for the spaces controller. |
| controller.controller.extraArgs | list | `[]` | Additional arguments to pass to the spaces controller. |
| controller.controller.extraEnv | list | `[]` | Additional environment variables to pass to the spaces controller. |
| controller.controller.extraVolumeMounts | list | `[]` | Additional volume mounts to pass to the spaces controller. |
| controller.controller.image.pullPolicy | string | `"IfNotPresent"` | The pull policy for the spaces controller image. |
| controller.controller.image.repository | string | `"hyperspace"` | The repository for the spaces controller image. |
| controller.controller.image.tag | string | `""` | The tag for the spaces controller image. |
| controller.controller.podDisruptionBudget.enabled | bool | `false` | This enables the PodDisruptionBudget for the spaces controller deployment. |
| controller.controller.podDisruptionBudget.maxUnavailable | string | `nil` | The maximum number of unavailable pods for the PodDisruptionBudget. Only one of maxUnavailable or minAvailable can be set. |
| controller.controller.podDisruptionBudget.minAvailable | string | `nil` | The minimum number of available pods for the PodDisruptionBudget. Only one of maxUnavailable or minAvailable can be set. |
| controller.controller.resources.limits.cpu | string | `"1000m"` | CPU limit for the spaces controller. |
| controller.controller.resources.limits.memory | string | `"2000Mi"` | Memory limit for the spaces controller. |
| controller.controller.resources.requests.cpu | string | `"250m"` | CPU request for the spaces controller. |
| controller.controller.resources.requests.memory | string | `"500Mi"` | Memory request for the spaces controller. |
| controller.controller.service.metrics.port | int | `8085` | The port for the spaces controller metrics service. |
| controller.controller.service.type | string | `"ClusterIP"` |  |
| controller.controller.service.webhook.hostNetwork | bool | `false` | Enable host networking for webhook to support Cilium-enabled clusters. |
| controller.controller.service.webhook.hostPort | int | `9443` | Host port for webhook when using host networking (only used if hostNetwork is true). |
| controller.controller.service.webhook.port | int | `9443` | The port for the spaces controller webhook service. |
| controller.controller.verticalPodAutoscaler.enabled | bool | `false` | This enables the VerticalPodAutoscaler for the spaces controller deployment. |
| controller.controller.verticalPodAutoscaler.maxAllowed | object | `{}` | Upper bound for VPA memory recommendations; set higher than controller.controller.resources.limits.memory when enabling VPA. |
| controller.controller.verticalPodAutoscaler.minAllowed | object | `{}` | Optional lower bound for VPA memory recommendations. Omit memory or leave unset when not needed. |
| controller.controller.verticalPodAutoscaler.updateMode | string | `"Off"` | The mode for the VerticalPodAutoscaler. |
| controller.crossplane.supportedVersions | list | `["1.19.0-up.1","1.19.2-up.1","1.19.3-up.1","1.20.0-up.1","1.20.1-up.1","1.20.4-up.1","1.20.5-up.1","1.20.6-up.2","1.20.8-up.1","1.20.10-up.1","1.20.11-up.1","1.20.11-up.2","2.0.7-up.2","2.0.8-up.1","2.0.8-up.2","2.0.8-up.3","2.0.8-up.4","2.0.8-up.6","2.0.8-up.7","2.1.4-up.3","2.1.5-up.1","2.1.6-up.1","2.1.7-up.1","2.1.7-up.2","2.1.8-up.1","2.1.8-up.2","2.2.0-up.3","2.2.1-up.1","2.2.2-up.1","2.2.4-up.1","2.2.4-up.2","2.3.4-up.1","2.3.4-up.2"]` | List of supported Crossplane versions, will be automatically updated by the versionsController, if enabled. |
| controller.crossplane.versionsController.enabled | bool | `true` | This flag enables the versionsController. When set to true, the controller will manage Crossplane versions configmap. If disabled, default behavior will be supportedVersions will applied without automatic updates. |
| controller.extraVolumes | list | `[]` | Extra volumes to be added to the spaces controller pods. |
| controller.kcp.enabled | bool | `false` | Whether spaces controller should be KCP aware. |
| controller.mxeInit.extraArgs | list | `[]` | Additional arguments to pass to the spaces controller init container. |
| controller.mxeInit.extraEnv | list | `[]` | Additional environment variables to pass to the spaces controller init container. |
| controller.mxeInit.extraVolumeMounts | list | `[]` | Additional volume mounts to pass to the spaces controller init container. |
| controller.mxeInit.image.pullPolicy | string | `"IfNotPresent"` | The image pull policy for the spaces controller init container image. |
| controller.mxeInit.image.repository | string | `"hyperspace"` | The repository for the spaces controller init container image. |
| controller.mxeInit.image.tag | string | `""` | The tag for the spaces controller init container image. |
| controller.mxeInit.resources | object | `{}` | Resource requests and limits for the spaces controller init container. |
| controller.podAnnotations | object | `{}` | Annotations to be added to the spaces controller pods. |
| controller.podSecurityContext | object | `{}` | Pod security context for the spaces controller. |
| controller.preUpgradeHook.resources | object | `{}` | Resource requests and limits for the spaces pre-upgrade verify Job pod. |
| controller.prometheus.podMonitor.enabled | bool | `false` | This enables the PodMonitor for the spaces controller deployment. |
| controller.prometheus.podMonitor.interval | string | `"30s"` | The interval at which the PodMonitor scrapes metrics. |
| controller.replicaCount | int | `1` | Number of replicas for the spaces controller deployment. |
| controller.secretRefs.adminSigning | string | `"cert-admin-signing"` | Name of the secret containing the Certificate Authority for the spaces controller, used to sign tokens for control plane kubeconfigs. |
| controller.secretRefs.ingressCA | string | `"spaces-router-tls"` | Name of the secret containing the Ingress CA. Deprecated: Please use externalTLS.caBundleSecret.name instead. |
| controller.serviceAccount.annotations | object | `{}` | Annotations to be added to the service account used by the spaces controller deployment. |
| controller.serviceAccount.create | bool | `true` | Whether to create a service account for the spaces controller deployment. |
| controller.serviceAccount.name | string | `""` | The name of the service account used by the spaces controller deployment. |
| controller.webhookInit.extraArgs | list | `[]` | Additional arguments to pass to the spaces controller webhook init container. |
| controller.webhookInit.extraEnv | list | `[]` | Additional environment variables to pass to the spaces controller webhook init container. |
| controller.webhookInit.extraVolumeMounts | list | `[]` | Additional volume mounts to pass to the spaces controller webhook init container. |
| controller.webhookInit.image.pullPolicy | string | `"IfNotPresent"` | The image pull policy for the spaces controller webhook init container image. |
| controller.webhookInit.image.repository | string | `"hyperspace"` | The repository for the spaces controller webhook init container image. |
| controller.webhookInit.image.tag | string | `""` | The tag for the spaces controller webhook init container image. |
| controller.webhookInit.resources | object | `{}` | Resource requests and limits for the spaces controller webhook init container. |
| development | object | `{}` | Development only configurations, not for production use. @schema additionalProperties: true @schema |
| externalTLS | object | `{"caBundleSecret":{"key":"ca.crt","name":""},"host":"","tlsSecret":{"name":""}}` | TLS configuration for the external traffic. |
| externalTLS.caBundleSecret | object | `{"key":"ca.crt","name":""}` | CA secret configuration for external traffic. spaces-router will use this CA (if not in insecure mode) and ingress-public configmap will contain this CA bundle. |
| externalTLS.caBundleSecret.key | string | `"ca.crt"` | Key of the external CA secret that contains the CA bundle. |
| externalTLS.caBundleSecret.name | string | `""` | Name of the secret containing the external CA bundle. |
| externalTLS.host | string | `""` | Specifies the externally routable hostname for Spaces. If empty, falls back to gatewayAPI.host or ingress.host. |
| externalTLS.tlsSecret | object | `{"name":""}` | TLS secret name that contains the serving certificate and key. |
| externalTLS.tlsSecret.name | string | `""` | Name of the secret containing the TLS serving certificate and key. |
| features.alpha | object | { ... } | NOTE: Alpha features are subject to removal or breaking changes without notice, and generally not considered ready for use in production. They have to be optional even if they are enabled. |
| features.alpha.apollo.enabled | bool | `false` | DEPRECATED: The apollo (Query API) feature is deprecated as of Spaces 1.18 and will be removed in a future release. This enables the apollo (query API) feature. |
| features.alpha.argocdPlugin.enabled | bool | `false` | Wheather to enable the argocd plugin feature. |
| features.alpha.argocdPlugin.target.externalCluster | object | `{"enabled":false,"secret":{"key":"kubeconfig","name":"kubeconfig"}}` | The secret name and key for the kubeconfig of the external cluster. This is used by the argocd plugin to connect to the external cluster in case ArgoCD does not run in the same cluster as Spaces. If not specified, defaults to in-cluster credentials. |
| features.alpha.argocdPlugin.target.externalCluster.enabled | bool | `false` | Whether to use the provided kubeconfig secret for the argocd plugin, otherwise in-cluster credentials will be used. |
| features.alpha.argocdPlugin.target.externalCluster.secret.key | string | `"kubeconfig"` | The key at which the kubeconfig is stored in the secret. Ignored if externalCluster.enabled is false. |
| features.alpha.argocdPlugin.target.externalCluster.secret.name | string | `"kubeconfig"` | The name of the secret containing the kubeconfig for the external cluster. Ignored if externalCluster.enabled is false. |
| features.alpha.argocdPlugin.target.secretNamespace | string | `"argocd"` | The namespace where the ArgoCD cluster secrets should be created in. |
| features.alpha.argocdPlugin.useUIDFormatForCTPSecrets | bool | `false` | If enabled, old secrets with <ctp-name> will be deleted and recreated with the <ctp-uid>. |
| features.alpha.hostNamespace.enabled | bool | `false` | This enables alpha support for user-configurable control plane host namespaces. |
| features.alpha.sharedSecrets.enabled | bool | `true` | This enables the shared secrets feature. |
| features.alpha.simulations.controlPlanes | object | `{"size":""}` | Control plane configuration for the Upbound Simulations feature. |
| features.alpha.simulations.controlPlanes.size | string | `""` | The control plane size to use when running simulations. |
| features.alpha.simulations.enabled | bool | `false` | This enables simulating changes to a control plane. |
| features.alpha.spaceBackup | object | `{"enabled":true}` | Configurations for the space backup feature. |
| features.alpha.spaceBackup.enabled | bool | `true` | This enables the space backup feature. |
| features.alpha.topologies.enabled | bool | `false` | This enables the topologies feature. |
| features.alpha.upboundControllers.enabled | bool | `false` | This enables the Upbound Controllers feature. |
| features.alpha.upboundRBAC.enabled | bool | `false` | This enables respecting Upbound Authorization management within the space. This will include new APIs for binding Objects to identities supplied by Upbound. |
| features.beta | object | `{}` | Beta features are on by default, but may be disabled here. Beta features are considered to be well tested, and will not be removed completely without being marked deprecated for at least two releases. |
| fullnameOverride | string | `""` | The full name of the chart, including the repository name. |
| gatewayAPI | object | `{"gateway":{"className":"spaces","name":"spaces","namespace":"","provision":false},"host":"proxy.upbound-127.0.0.1.nip.io","insecure":false,"namespaceLabels":{},"podLabels":{},"spacesRouterRoute":{"provision":false}}` | Configurations for external requests coming into the space. |
| gatewayAPI.gateway | object | { ... } | Configurations for the Gateway resource that will act as an application gateway for Spaces. |
| gatewayAPI.gateway.className | string | `"spaces"` | Specifies the GatewayClass name for the Gateway being provisioned if gatewayAPI.gateway.provision is `true`. |
| gatewayAPI.gateway.name | string | `"spaces"` | Specifies the name of the Gateway resource to be used as the parent of the spaces routes, and to be provisioned if gatewayAPI.gateway.provision is `true`. |
| gatewayAPI.gateway.namespace | string | `""` | Specifies the namespace of the Gateway resource. Used in parentRefs of HTTPRoute/TLSRoute to reference a Gateway in a different namespace (e.g. a shared Gateway). If empty, parentRef defaults to the Route's namespace (not the release namespace). Only applicable when gatewayAPI.gateway.provision is `false` (referencing an externally-managed Gateway). Cross-namespace Route→Gateway attachment is governed by the Gateway listener setting allowedRoutes.namespaces.from. |
| gatewayAPI.gateway.provision | bool | `false` | Specifies whether the helm chart should provision the Gateway resource for routing external traffic into the cluster. |
| gatewayAPI.host | string | `"proxy.upbound-127.0.0.1.nip.io"` | Specifies the externally routable hostname used for routing requests to individual control planes. |
| gatewayAPI.insecure | bool | `false` | Disable TLS at the endpoints |
| gatewayAPI.namespaceLabels | object | `{}` | Labels that identify the namespace containing the Gateway API pods. Used in NetworkPolicy rules along with podLabels to allow traffic from the gateway to spaces-router. Example for Envoy Gateway:   kubernetes.io/metadata.name: envoy-gateway-system |
| gatewayAPI.podLabels | object | `{}` | Labels that identify the Gateway API pods. Used in NetworkPolicy rules to allow traffic from the gateway to spaces-router. Must match your Gateway implementation's pod labels. Example for Envoy Gateway:   app.kubernetes.io/name: envoy   app.kubernetes.io/component: proxy   app.kubernetes.io/managed-by: envoy-gateway |
| gatewayAPI.spacesRouterRoute | object | { ... } | Configurations for the TLS or HTTP route that forwards external traffic into spaces-router. |
| gatewayAPI.spacesRouterRoute.provision | bool | `false` | Specifies whether the Helm chart should provision the TLSRoute or HTTPRoute resource (depending on how spaces-router is configured) for routing traffic to spaces-router. |
| imagePullSecrets | list | `[{"name":"upbound-pull-secret"}]` | NOTE: only an imagePullSecret of "upbound-pull-secret" is currently supported. |
| ingress | object | `{"annotations":{},"host":"proxy.upbound-127.0.0.1.nip.io","ingressClassName":"","insecure":false,"namespaceLabels":{},"podLabels":{},"provision":false}` | Configurations for the Ingress resource. |
| ingress.annotations | object | `{}` | Allows setting ingress annotations for the external facing Ingress that terminates at the spaces-router deployment. Use this for controller-specific configuration. |
| ingress.host | string | `"proxy.upbound-127.0.0.1.nip.io"` | Specifies the externally routable hostname used for routing requests to individual control planes. |
| ingress.ingressClassName | string | `""` | The IngressClass name to use. Must match the name of an IngressClass in your cluster. Leave empty to use the cluster's default IngressClass. |
| ingress.insecure | bool | `false` | Disable TLS at the endpoints. |
| ingress.namespaceLabels | object | `{}` | Labels that identify the namespace containing the ingress controller pods. Used in NetworkPolicy rules along with podLabels to allow traffic from the ingress controller to spaces-router. Example for Traefik:   kubernetes.io/metadata.name: traefik |
| ingress.podLabels | object | `{}` | Labels that identify the ingress controller pods. Used in NetworkPolicy rules to allow traffic from the ingress controller to spaces-router. Must match your ingress controller's pod labels. Example for Traefik:   app.kubernetes.io/name: traefik |
| ingress.provision | bool | `false` | Specifies whether the helm chart should create an Ingress resource for routing requests to the spaces-router. |
| metering.aggregationInterval | string | `"1h"` | How often to aggregate measurements into hourly usage data. |
| metering.enabled | bool | `false` | This enables metering collection for control planes. |
| metering.interval | string | `"1m"` | How often to collect measurements from control planes. |
| metering.measurementRetentionDays | int | `30` | Number of days to retain raw measurement data. Set to 0 for unlimited retention. |
| metering.storage | object | { ... } | PostgreSQL storage configuration for metering data (required when metering is enabled). |
| metering.storage.postgres.connection | object | { ... } | Connection details for the PostgreSQL database. |
| metering.storage.postgres.connection.ca | object | `{"name":""}` | CA certificate configuration for TLS connections (optional). |
| metering.storage.postgres.connection.ca.name | string | `""` | The name of the secret containing the CA certificate. |
| metering.storage.postgres.connection.credentials | object | `{"secret":{"name":""}}` | Credentials secret configuration. |
| metering.storage.postgres.connection.credentials.secret.name | string | `""` | The name of the secret containing the database credentials in pgpass format. |
| metering.storage.postgres.connection.sslmode | string | `"require"` | sslmode for the connection to the database. |
| metering.storage.postgres.connection.url | string | `""` | The connection URL (host:port format, e.g., "postgres.example.com:5432"). |
| metering.workerCount | int | `10` | Number of workers for parallel measurement collection. |
| nameOverride | string | `""` | The name of the chart. |
| networkPolicies.enabled | bool | `true` | Whether to install the NetworkPolicies that Spaces ships. This covers both the Space components in upbound-system and the policies installed into every control plane host namespace. |
| observability.collectors | object | `{"apiServer":{"auditPolicy":""},"includeSystemTelemetry":false,"logCollector":{"resources":{"limits":{"cpu":null,"memory":null},"requests":{"cpu":"10m","memory":"100Mi"}},"tolerations":[]},"repository":"opentelemetry-collector-spaces","resources":{"limits":{"cpu":"100m","memory":"1Gi"},"requests":{"cpu":"10m","memory":"100Mi"}},"tag":""}` | Observability configuration to collect metrics and traces ( and logs in the future) from the Control Plane. <br> Use SharedTelemetryConfig API to configure the exporters for Control Planes and Control Plane Groups. <br> Control Plane telemetry collection is disabled by default and gated by the "features.alpha.observability.enabled" parameter. |
| observability.collectors.includeSystemTelemetry | bool | `false` | If true, control plane telemetry will emit telemetry data from control plane system components, such as the api server, etcd. |
| observability.collectors.logCollector | object | `{"resources":{"limits":{"cpu":null,"memory":null},"requests":{"cpu":"10m","memory":"100Mi"}},"tolerations":[]}` | Resource configuration for the control-plane-log-collector DaemonSet that runs on host nodes to aggregate logs from control planes with logging enabled. |
| observability.collectors.logCollector.resources.limits.cpu | string | `nil` | CPU limit for the log collector DaemonSet pods. |
| observability.collectors.logCollector.resources.limits.memory | string | `nil` | Memory limit for the log collector DaemonSet pods. |
| observability.collectors.logCollector.resources.requests.cpu | string | `"10m"` | CPU request for the log collector DaemonSet pods. |
| observability.collectors.logCollector.resources.requests.memory | string | `"100Mi"` | Memory request for the log collector DaemonSet pods. |
| observability.collectors.logCollector.tolerations | list | `[]` | Tolerations for the log collector DaemonSet pods. |
| observability.collectors.repository | string | `"opentelemetry-collector-spaces"` | Repository for the OpenTelemetry collector image. |
| observability.collectors.resources.limits.cpu | string | `"100m"` | CPU limit for the OpenTelemetry collector pod. |
| observability.collectors.resources.limits.memory | string | `"1Gi"` | Memory limit for the OpenTelemetry collector pod. |
| observability.collectors.resources.requests.cpu | string | `"10m"` | CPU request for the OpenTelemetry collector pod. |
| observability.collectors.resources.requests.memory | string | `"100Mi"` | Memory request for the OpenTelemetry collector pod. |
| observability.collectors.tag | string | `""` | Tag for the OpenTelemetry collector image. |
| observability.enabled | bool | `false` | This enables the observability feature within this space.<br> Enabling observability requires OpenTelemetry Operator for Kubernetes to be installed in the cluster. See https://opentelemetry.io/docs/kubernetes/operator/ |
| observability.spacesCollector | object | `{"config":{"exportPipeline":{"logs":[],"metrics":[],"traces":[]},"exporters":{"debug":null}},"env":[],"repository":"opentelemetry-collector-spaces","resources":{"limits":{"cpu":"100m","memory":"1Gi"},"requests":{"cpu":"10m","memory":"100Mi"}},"tag":""}` | Observability configuration to collect metric and logs from the Spaces machinery and send them to the specified exporters. When enabled, collects metrics from Spaces infrastructure components including router control plane and Envoy proxy metrics (timeouts, status codes, latency, circuit breakers). |
| observability.spacesCollector.config.exportPipeline | object | `{"logs":[],"metrics":[],"traces":[]}` | The space-level OpenTelemetry collector exporter configuration. <br> otlphttp: <br>   endpoint: https://otlp.eu01.nr-data.net <br>   headers: <br>     api-key: "${env:API_KEY}" <br> |
| observability.spacesCollector.config.exportPipeline.logs | list | `[]` | List of logs exporters names. |
| observability.spacesCollector.config.exportPipeline.metrics | list | `[]` | List of metrics exporters names. |
| observability.spacesCollector.config.exportPipeline.traces | list | `[]` | List of traces exporters names. |
| observability.spacesCollector.config.exporters | object | `{"debug":null}` | To export observability data, configure the exporters here and update the exportPipeline to include the exporters you want to use per telemetry type. |
| observability.spacesCollector.config.exporters.debug | string | `nil` | The debug exporter configuration. |
| observability.spacesCollector.env | list | `[]` | Environment variables to set on the Spaces OpenTelemetry collector pods. Useful for injecting secrets via secretKeyRef for exporters like Datadog, Honeycomb, etc. |
| observability.spacesCollector.repository | string | `"opentelemetry-collector-spaces"` | Repository for the space-level OpenTelemetry collector image. |
| observability.spacesCollector.resources.limits.cpu | string | `"100m"` | CPU limit for the space-level OpenTelemetry collector pod. |
| observability.spacesCollector.resources.limits.memory | string | `"1Gi"` | Memory limit for the space-level OpenTelemetry collector pod. |
| observability.spacesCollector.resources.requests.cpu | string | `"10m"` | CPU request for the space-level OpenTelemetry collector pod. |
| observability.spacesCollector.resources.requests.memory | string | `"100Mi"` | Memory request for the space-level OpenTelemetry collector pod. |
| observability.spacesCollector.tag | string | `""` | Tag for the space-level OpenTelemetry collector image. |
| observability.tracing | object | `{"enabled":false,"endpoint":"telemetry-spaces-collector.upbound-system.svc.cluster.local","port":4317,"sampling":{"rate":0.1},"tls":{"caBundleSecretRef":""}}` | Unified tracing configuration for Spaces system components (spaces-router, spaces-api, etc.). |
| observability.tracing.enabled | bool | `false` | Enable distributed tracing for Spaces system components. When disabled, no traces are collected or sent, regardless of other tracing settings. |
| observability.tracing.endpoint | string | `"telemetry-spaces-collector.upbound-system.svc.cluster.local"` | OTLP-compatible endpoint for traces. Supports both in-cluster and external collectors. Defaults to the in-cluster spacesCollector deployed by this chart. For external collectors (e.g., Honeycomb), set to the full hostname: api.honeycomb.io |
| observability.tracing.port | int | `4317` | OTLP gRPC port for trace export. |
| observability.tracing.sampling | object | `{"rate":0.1}` | Sampling configuration for distributed tracing. |
| observability.tracing.sampling.rate | float | `0.1` | Trace sampling rate (0.0-1.0). Controls what fraction of traces are collected. Uses parent-based sampling: if a trace is started upstream with sampling decision, that decision is respected. For new traces (no parent), this rate determines sampling probability. Default 0.1 (10%) |
| observability.tracing.tls | object | `{"caBundleSecretRef":""}` | TLS configuration for the telemetry collector connection. |
| observability.tracing.tls.caBundleSecretRef | string | `""` | Name of the secret containing a CA bundle for validating the telemetry collector's certificate. The secret must contain a key named 'ca.crt' with the PEM-encoded CA bundle. Use this when connecting to external collectors. If empty, uses the Spaces CA for in-cluster collectors. |
| registry | string | `"xpkg.upbound.io/spaces-artifacts"` | Specifies the registry where the containers used in the spaces deployment are served from. |
| router | object | `{"controlPlane":{"command":[],"extraArgs":[],"extraEnv":[],"extraVolumeMounts":[],"image":{"pullPolicy":"IfNotPresent","repository":"hyperspace","tag":""},"resources":{"limits":{"cpu":"1000m","memory":"1000Mi"},"requests":{"cpu":"100m","memory":"100Mi"}},"service":{"auth":{"port":9000},"grpc":{"port":8081},"http":{"port":9091},"metrics":{"port":8085},"privateHttp":{"port":9092}}},"extraVolumes":[],"hpa":{"enabled":false,"maxReplicas":5,"minReplicas":1,"targetCPUUtilizationPercentage":80,"targetMemoryUtilizationPercentage":0},"insecure":false,"podAnnotations":{},"podLabels":{},"prometheus":{"podMonitor":{"enabled":false,"interval":"30s"}},"proxy":{"affinity":{},"extraArgs":[],"extraEnv":[],"extraVolumeMounts":[],"hostPort":null,"image":{"pullPolicy":"IfNotPresent","repository":"envoy","tag":"distroless-v1.38.3"},"nodeSelector":{},"resources":{"limits":{"cpu":"1000m","memory":"200Mi"},"requests":{"cpu":"100m","memory":"50Mi"}},"service":{"annotations":{},"http":{"appProtocol":"https","name":"https","port":8443},"type":"ClusterIP"},"tolerations":[]},"replicaCount":1,"secretRefs":{"adminValidating":"cert-admin-signing","gatewaySigning":"cert-token-signing-gateway","tlsSecretName":"spaces-router-tls","upboundIAMCABundle":""},"serviceAccount":{"annotations":{},"create":true,"name":""}}` | Configurations for the space router deployment. |
| router.controlPlane.command | list | `[]` | The command to run for the router's envoy control plane. |
| router.controlPlane.extraArgs | list | `[]` | Additional arguments to pass to the router's envoy control plane. |
| router.controlPlane.extraEnv | list | `[]` | Additional environment variables to pass to the router's envoy control plane. |
| router.controlPlane.extraVolumeMounts | list | `[]` | Additional volume mounts to pass to the router's envoy control plane. |
| router.controlPlane.image.pullPolicy | string | `"IfNotPresent"` | The pull policy for the router's envoy control plane image. |
| router.controlPlane.image.repository | string | `"hyperspace"` | The repository for the router's envoy control plane image. |
| router.controlPlane.image.tag | string | `""` | The tag for the router's envoy control plane image. |
| router.controlPlane.resources.limits.cpu | string | `"1000m"` | CPU limit for the router's envoy control plane. |
| router.controlPlane.resources.limits.memory | string | `"1000Mi"` | Memory limit for the router's envoy control plane. |
| router.controlPlane.resources.requests.cpu | string | `"100m"` | CPU request for the router's envoy control plane. |
| router.controlPlane.resources.requests.memory | string | `"100Mi"` | Memory request for the router's envoy control plane. |
| router.controlPlane.service.auth.port | int | `9000` | The port for the router's envoy control plane auth service. |
| router.controlPlane.service.grpc.port | int | `8081` | The port for the router's envoy control plane gRPC service. |
| router.controlPlane.service.http.port | int | `9091` | The port for the router's envoy control plane HTTP service. |
| router.controlPlane.service.metrics.port | int | `8085` | The port for the router's envoy control plane metrics service. |
| router.controlPlane.service.privateHttp.port | int | `9092` | The port for the router's envoy control plane private HTTP service. |
| router.extraVolumes | list | `[]` | Extra volumes to be added to the router pods. |
| router.hpa.enabled | bool | `false` | This enables the Horizontal Pod Autoscaler for the router deployment. |
| router.hpa.maxReplicas | int | `5` | The maximum number of replicas for the Horizontal Pod Autoscaler. |
| router.hpa.minReplicas | int | `1` | The minimum number of replicas for the Horizontal Pod Autoscaler. |
| router.hpa.targetCPUUtilizationPercentage | int | `80` | The target CPU utilization percentage for the Horizontal Pod Autoscaler. |
| router.hpa.targetMemoryUtilizationPercentage | int | `0` | The target memory utilization percentage for the Horizontal Pod Autoscaler. |
| router.insecure | bool | `false` | Disable TLS at the endpoints |
| router.podAnnotations | object | `{}` | Annotations to be added to the router pods. |
| router.podLabels | object | `{}` | Labels to be added to the router pods. |
| router.prometheus.podMonitor.enabled | bool | `false` | This enables the PodMonitor for the router deployment. |
| router.prometheus.podMonitor.interval | string | `"30s"` | The interval at which the PodMonitor scrapes metrics. |
| router.proxy.affinity | object | `{}` | Affinity for the router's envoy proxy. |
| router.proxy.extraArgs | list | `[]` | Additional arguments to pass to the router's envoy proxy. |
| router.proxy.extraEnv | list | `[]` | Additional environment variables to pass to the router's envoy proxy. |
| router.proxy.extraVolumeMounts | list | `[]` | Additional volume mounts to pass to the router's envoy proxy. |
| router.proxy.hostPort | string | `nil` | Host port for the router's envoy proxy container. When set, the envoy container will bind to this port on the host. This is useful for environments like kind where LoadBalancer services are not available. |
| router.proxy.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy for the router's envoy proxy image. |
| router.proxy.image.repository | string | `"envoy"` | Repository for the router's envoy proxy image. |
| router.proxy.image.tag | string | `"distroless-v1.38.3"` | Tag for the router's envoy proxy image. |
| router.proxy.nodeSelector | object | `{}` | Node selector for the router's envoy proxy. |
| router.proxy.resources.limits.cpu | string | `"1000m"` | CPU limit for the router's envoy proxy. |
| router.proxy.resources.limits.memory | string | `"200Mi"` | Memory limit for the router's envoy proxy. |
| router.proxy.resources.requests.cpu | string | `"100m"` | CPU request for the router's envoy proxy. |
| router.proxy.resources.requests.memory | string | `"50Mi"` | Memory request for the router's envoy proxy. |
| router.proxy.service.annotations | object | `{}` | Annotations for the router's envoy proxy service. |
| router.proxy.service.http.appProtocol | string | `"https"` | The name for the port, this should conform the values defined by [k8s protocol](https://kubernetes.io/docs/concepts/services-networking/service/#application-protocol) |
| router.proxy.service.http.name | string | `"https"` | The name for the port, this should conform the values defined by [k8s protocol](https://kubernetes.io/docs/concepts/services-networking/service/#application-protocol) |
| router.proxy.service.http.port | int | `8443` | The container/target port for the router's envoy proxy. |
| router.proxy.service.type | string | `"ClusterIP"` | Type for the router's envoy proxy service. |
| router.proxy.tolerations | list | `[]` | Toleration for the router's envoy proxy. |
| router.replicaCount | int | `1` | The number of replicas for the router deployment. |
| router.secretRefs.adminValidating | string | `"cert-admin-signing"` | Name of the secret containing the admin signing certificate. |
| router.secretRefs.gatewaySigning | string | `"cert-token-signing-gateway"` | Name of the secret containing the internal token signing certificat  host: proxy.upbound-127.0.0.1.nip.ioe |
| router.secretRefs.tlsSecretName | string | `"spaces-router-tls"` | Name of the secret containing the TLS Certificate for the router. Deprecated: Please use externalTLS.tlsSecret.name instead. |
| router.secretRefs.upboundIAMCABundle | string | `""` | Name of the secret containing the CA bundle for the configured UpboundIAM Issuer. This is helpful for testing when configuring against an Issuer using self-signed certificates. |
| router.serviceAccount.annotations | object | `{}` | Annotations to be added to the service account used by the router deployment. |
| router.serviceAccount.create | bool | `true` | Whether to create a service account for the router deployment. |
| router.serviceAccount.name | string | `""` | The name of the service account used by the router deployment. |
| securityContext | object | `{}` | Security context for system components. |
| space | object | `{"labels":{}}` | Configurations that are applied consistently across the space. |
| space.labels | object | `{}` | Labels that are applied to all Deployments, Pods, Services, StatefulSets, and Jobs managed by the Space. |
| version | string | `""` | Overall artifact version that affects xpkgs and related components. |

</div>

<!-- vale on -->

<!-- end-table-no -->
