---
title: Exposing Spaces externally
sidebar_position: 5
description: Options for exposing Spaces externally
---

import GlobalLanguageSelector, { CodeBlock } from '@site/src/components/GlobalLanguageSelector';

<GlobalLanguageSelector />

You can expose Spaces externally using one of three options:

| Option | When to use |
|--------|-------------|
| LoadBalancer Service | Simplest setup, recommended for most deployments |
| Gateway API | Organization already using Gateway API, or need shared gateway across services |
| Ingress | Organization already using Ingress, or need shared load balancer across services |
<!-- vale Google.Headings = NO -->
## LoadBalancer Service
<!-- vale Google.Headings = YES -->

Upbound recommends a LoadBalancer Service to expose `spaces-router`.


:::important
Use a Network Load Balancer (L4), not an Application Load Balancer (L7). Spaces
uses long-lived connections for watch traffic that L7 load balancers may
timeout.
:::

### Configuration

Add the following to your **Spaces Helm values** (or pass via `--set` when installing or upgrading). Choose the block for your cloud:

<CodeBlock cloud="aws">

```yaml
externalTLS:
  host: proxy.example.com  # Externally routable hostname for TLS certificates

router:
  proxy:
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/aws-load-balancer-type: external
        service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing
        service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
```

</CodeBlock>

<CodeBlock cloud="azure">

```yaml
externalTLS:
  host: proxy.example.com  # Externally routable hostname for TLS certificates

router:
  proxy:
    service:
      type: LoadBalancer
      annotations: {}  # Azure uses L4 by default
```

</CodeBlock>

<CodeBlock cloud="gcp">

```yaml
externalTLS:
  host: proxy.example.com  # Externally routable hostname for TLS certificates

router:
  proxy:
    service:
      type: LoadBalancer
      annotations:
        cloud.google.com/l4-rbs: enabled
```

</CodeBlock>

<!-- vale Google.Headings = NO -->
### Get the LoadBalancer address
<!-- vale Google.Headings = YES -->

After installation:

```bash
kubectl get svc -n upbound-system spaces-router \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Create or update a DNS record pointing your `externalTLS.host` to this address.

## Ingress

Use Ingress if you need to share a load balancer across multiple services or
have specific networking requirements.

### Requirements

- TLS passthrough support in your Ingress controller
- Network Load Balancer (L4) strongly recommended for long-lived connections
<!-- vale gitlab.Uppercase = NO -->
Configure your Ingress controller's Service with [NLB annotations](#cloud-specific-annotations).
<!-- vale gitlab.Uppercase = YES -->

### Configuration

Add the following to your **Spaces Helm values** (or pass via `--set` when installing or upgrading):

```yaml
ingress:
  provision: true
  host: proxy.example.com
  ingressClassName: "<your-ingress-class>"
  # Annotations to add to the Ingress resource
  annotations: {}
  # Pod labels of the Ingress controller - used for network policy
  podLabels: {}
  # Namespace labels of the Ingress controller - used for network policy
  namespaceLabels: {}
```

### Traefik (with nginx provider)

Traefik can use the [kubernetesIngressNGINX provider][traefik-provider] to
handle nginx-style Ingress resources with TLS passthrough. Add to your **Spaces Helm values**:

```yaml
ingress:
  provision: true
  host: proxy.example.com
  ingressClassName: nginx
  annotations:
    nginx.ingress.kubernetes.io/ssl-passthrough: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
  podLabels:
    app.kubernetes.io/name: traefik
  namespaceLabels:
    kubernetes.io/metadata.name: traefik
```

## Gateway API

Spaces supports the [Gateway API][gateway-api-docs]. Use this option if your
organization is already using Gateway API or needs a shared gateway across
multiple services.

### Requirements

- A Gateway API controller (for example, Envoy Gateway, Cilium, or Traefik)
- Gateway API CRDs installed in your cluster
- TLS passthrough support
- Network Load Balancer (L4) strongly recommended

For step-by-step setup including installing a controller (such as Envoy Gateway) and creating the GatewayClass, see [Migrate away from ingress-nginx - Gateway API][migration-gateway-api].

### Gateway API configuration

Add the following to your **Spaces Helm values** (or use `--set` when upgrading). Disable Ingress when using Gateway API.

```yaml
gatewayAPI:
  host: proxy.example.com  # Externally routable hostname; must match your DNS
  gateway:
    provision: true
    name: spaces
    className: spaces  # Must match your GatewayClass name
  spacesRouterRoute:
    provision: true
  podLabels:
    app.kubernetes.io/name: envoy
    app.kubernetes.io/component: proxy
    app.kubernetes.io/managed-by: envoy-gateway
  namespaceLabels:
    kubernetes.io/metadata.name: envoy-gateway-system
```

The `podLabels` and `namespaceLabels` must match your Gateway API controller's pods and namespace (for NetworkPolicy). The example above uses Envoy Gateway; adjust for your controller.

Install or upgrade Spaces with these values:

```bash
helm upgrade spaces oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --namespace upbound-system \
  -f values.yaml \
  --wait
```

### Get the gateway address

After your controller has configured the Gateway:

```bash
kubectl get gateway -n upbound-system spaces \
  -o jsonpath='{.status.addresses[0].value}'
```

Create or update a DNS record so that `gatewayAPI.host` points to this address.

### Troubleshooting

- **Gateway status:** Run `kubectl get gateway -n upbound-system spaces -o yaml`. Look for `Accepted` and `Programmed` in `status.conditions`.
- **TLSRoute status:** Run `kubectl get tlsroute -n upbound-system spaces-router -o yaml`. The route should show `Accepted: True`.
- **Connectivity:** Run `curl -k "https://<your-host>/version"`. Expected response is `401 Unauthorized` (routing works, auth required).

## Cloud-specific annotations

Network Load Balancers (L4) are strongly recommended. Spaces uses long-lived
watch connections (hours or days) for kubectl and ArgoCD. L7 load balancers may
timeout these connections. Use these annotations on the LoadBalancer Service
(spaces-router, Ingress controller, or Gateway).

| Cloud | Annotations |
|-------|-------------|
| **AWS** | `service.beta.kubernetes.io/aws-load-balancer-type: external`<br/>`service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing`<br/>`service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip` |
| **GCP** | `cloud.google.com/l4-rbs: enabled` |
| **Azure** | None required (L4 by default) |
<!-- vale gitlab.Uppercase = YES -->

[traefik-provider]: https://doc.traefik.io/traefik/reference/install-configuration/providers/kubernetes/kubernetes-ingress-nginx/
[gateway-api-docs]: https://gateway-api.sigs.k8s.io/
[migration-gateway-api]: /self-hosted-spaces/howtos/ingress-nginx-migration/#gateway-api
