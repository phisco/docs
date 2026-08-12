---
title: Migrate away from ingress-nginx
sidebar_position: 7
description: A guide on how to migrate from ingress-nginx
tier: "business"
---

import GlobalLanguageSelector, { CodeBlock } from '@site/src/components/GlobalLanguageSelector';
import ThemeCodeBlock from '@theme/CodeBlock';
import { versions } from '@site/src/components/Version.js';

<GlobalLanguageSelector />

`ingress-nginx` is deprecated and will reach end-of-life in March 2026. This
guide covers migration options for existing Spaces deployments.

For help choosing an exposure method, see [Exposing Spaces Externally][expose].
Options vary by Spaces version. Select your Spaces version:

* [Upgrading to Spaces 1.16+](#upgrading-to-spaces-116)
* [Staying on Spaces 1.15 or earlier](#migrate-while-on-spaces-115-or-earlier)

<!-- vale Google.Headings = NO -->
## Prerequisites
<!-- vale Google.Headings = YES -->

Set environment variables used throughout this guide:

<ThemeCodeBlock language="bash">
{`export SPACES_VERSION=<version>  # Example: ${versions.spaces}
export SPACES_ROUTER_HOST=<hostname>  # Example: proxy.example.com`}
</ThemeCodeBlock>

Export your current Helm values to a file (or use an existing version-controlled
file):

```bash
helm get values spaces -n upbound-system -o yaml > values.yaml
```

You'll merge new configuration into this file throughout the migration.

## Upgrading to Spaces 1.16+

Choose your migration option:

| Option | When to use |
|--------|-------------|
| [LoadBalancer Service](#loadbalancer-service-recommended) | Simplest setup, no additional components needed |
| [Gateway API](#gateway-api) | Already using Gateway API or need shared gateway |
| [Alternative ingress controller](#alternative-ingress-controller) | Already using Ingress, or need shared load balancer |

All paths follow the same process: upgrade to 1.16+, switch exposure method,
then uninstall ingress-nginx.


### Upgrade to 1.16+ with Updated Ingress Values

Spaces doesn't provision the Ingress resource by default and is now
controller-agnostic.

Add the following to your `values.yaml` to keep ingress-nginx working:

```yaml
ingress:
  provision: true
  host: proxy.example.com  # Replace with your existing hostname
  ingressClassName: nginx
  annotations:
    nginx.ingress.kubernetes.io/ssl-passthrough: "true"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
  podLabels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/component: controller
  namespaceLabels:
    kubernetes.io/metadata.name: ingress-nginx
```

Upgrade Spaces to 1.16+:

```bash
helm upgrade spaces oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version ${SPACES_VERSION} \
  --namespace upbound-system \
  -f values.yaml \
  --wait
```

Verify ingress-nginx is still working before you continue.

### LoadBalancer Service (Recommended)

This section describes how to expose the `spaces-router` with a LoadBalancer
Service.

:::important
Use a Network Load Balancer (L4), not an Application Load Balancer (L7). Spaces
uses long-lived connections for watch traffic that L7 load balancers may
timeout.
:::

**1. Add the LoadBalancer Service configuration to your `values.yaml`**

Add the configuration for your cloud:

<CodeBlock cloud="aws">

```yaml
externalTLS:
  host: proxy.example.com  # Must match your current router hostname

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

<CodeBlock cloud="gcp">

```yaml
externalTLS:
  host: proxy.example.com  # Must match your current router hostname

router:
  proxy:
    service:
      type: LoadBalancer
      annotations:
        cloud.google.com/l4-rbs: enabled
```

</CodeBlock>

<CodeBlock cloud="azure">

```yaml
externalTLS:
  host: proxy.example.com  # Must match your current router hostname

router:
  proxy:
    service:
      type: LoadBalancer
      annotations: {}
```

</CodeBlock>

**2. Upgrade Spaces (Ingress stays running during transition)**

```bash
helm upgrade spaces oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version ${SPACES_VERSION} \
  --namespace upbound-system \
  -f values.yaml \
  --wait
```

**3. Get the new LoadBalancer address**

```bash
kubectl get svc -n upbound-system spaces-router \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

**4. Validate before switching DNS**

```bash
# Get spaces-router load balancer address
ROUTER_LB=$(kubectl get svc -n upbound-system spaces-router -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Test connectivity using --connect-to to route to the new LB
curl --connect-to "${SPACES_ROUTER_HOST}:443:${ROUTER_LB}:443" "https://${SPACES_ROUTER_HOST}/version"
# Expected: 401 Unauthorized (routing works, auth required)
```

**5. Update your DNS record to point to the new LoadBalancer address**

**6. Update your `values.yaml` to disable Ingress, then upgrade Spaces**

```yaml
ingress:
  provision: false
```

```bash
helm upgrade spaces oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version ${SPACES_VERSION} \
  --namespace upbound-system \
  -f values.yaml \
  --wait
```

**7. Uninstall ingress-nginx**

```bash
helm uninstall ingress-nginx --namespace ingress-nginx
```

### Gateway API

Spaces supports the [Gateway API][gateway-api] as an alternative to Ingress. Gateway API is the
Kubernetes standard for traffic routing going forward.


**1. Install Envoy Gateway**

```bash
helm install eg oci://docker.io/envoyproxy/gateway-helm \
  --namespace envoy-gateway-system \
  --create-namespace \
  --wait
```

See [Envoy Gateway installation docs][envoy-install] for more detailed instructions.

**2. Create EnvoyProxy and GatewayClass**

Create an `EnvoyProxy` resource that the GatewayClass references. See the [Envoy
Gateway EnvoyProxy docs][envoy-proxy] for the full API and more examples.

<CodeBlock cloud="aws">

```bash
kubectl apply -f - <<EOF
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: EnvoyProxy
metadata:
  name: spaces-proxy-config
  namespace: envoy-gateway-system
spec:
  provider:
    type: Kubernetes
    kubernetes:
      envoyService:
        annotations:
          service.beta.kubernetes.io/aws-load-balancer-type: external
          service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing
          service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
EOF
```

</CodeBlock>

<CodeBlock cloud="gcp">

```bash
kubectl apply -f - <<EOF
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: EnvoyProxy
metadata:
  name: spaces-proxy-config
  namespace: envoy-gateway-system
spec:
  provider:
    type: Kubernetes
    kubernetes:
      envoyService:
        annotations:
          cloud.google.com/l4-rbs: enabled
EOF
```

</CodeBlock>

<CodeBlock cloud="azure">

```bash
kubectl apply -f - <<EOF
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: EnvoyProxy
metadata:
  name: spaces-proxy-config
  namespace: envoy-gateway-system
spec:
  provider:
    type: Kubernetes
    kubernetes:
      envoyService:
        annotations: {}
EOF
```

</CodeBlock>

Then create the `GatewayClass` that references this EnvoyProxy:

```bash
kubectl apply -f - --server-side <<EOF
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: spaces
spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller
  parametersRef:
    group: gateway.envoyproxy.io
    kind: EnvoyProxy
    name: spaces-proxy-config
    namespace: envoy-gateway-system
EOF
```

**3. Configure Spaces Helm Values**

```yaml
ingress:
  provision: false  # Disable Ingress when using Gateway API

gatewayAPI:
  host: proxy.example.com
  gateway:
    provision: true
    name: spaces
    className: spaces
  spacesRouterRoute:
    provision: true
  podLabels:
    app.kubernetes.io/name: envoy
    app.kubernetes.io/component: proxy
    app.kubernetes.io/managed-by: envoy-gateway
  namespaceLabels:
    kubernetes.io/metadata.name: envoy-gateway-system
```

**4. Install or Upgrade Spaces**

See [Spaces installation docs][spaces-install] for detailed installation instructions.

```bash
helm upgrade spaces oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version ${SPACES_VERSION} \
  --namespace upbound-system \
  -f values.yaml \
  --wait
```

**5. Get the Gateway Address**

```bash
kubectl get gateway -n upbound-system spaces \
  -o jsonpath='{.status.addresses[0].value}'
```

:::note
If you're having issues with your setup, verify the configuration with these
troubleshooting steps:

* **Check Gateway Status**

    ```bash
    kubectl get gateway -n upbound-system spaces -o yaml
    ```

    Look for `status.conditions` - the Gateway should be `Accepted` and `Programmed`.

* **Check TLSRoute Status**

    ```bash
    kubectl get tlsroute -n upbound-system spaces-router -o yaml
    ```

    The route should show `Accepted: True` in its status.

* **Verify Connectivity**

    ```bash
    curl -k "https://${SPACES_ROUTER_HOST}/version"
    # Expected: 401 Unauthorized (routing works, auth required)
    ```
:::

**6. Validate before switching DNS**

```bash
# Get Gateway address
GATEWAY_LB=$(kubectl get gateway -n upbound-system spaces -o jsonpath='{.status.addresses[0].value}')

# Test connectivity using --connect-to to route to the new Gateway
curl --connect-to "${SPACES_ROUTER_HOST}:443:${GATEWAY_LB}:443" "https://${SPACES_ROUTER_HOST}/version"
# Expected: 401 Unauthorized (routing works, auth required)
```

**7. Update your DNS record to point to the new Gateway address**

Create or update a DNS record so that `gatewayAPI.host` resolves to the address
from step 5.

**8. Update your `values.yaml` to disable Ingress, then upgrade Spaces:**

```yaml
ingress:
  provision: false
```

```bash
helm upgrade spaces oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version ${SPACES_VERSION} \
  --namespace upbound-system \
  -f values.yaml \
  --wait
```

**9. Uninstall ingress-nginx**

```bash
helm uninstall ingress-nginx --namespace ingress-nginx
```

### Alternative ingress controller

Use any Ingress controller that supports TLS passthrough.

Configure your Ingress controller's Service with `NLB`
annotations. See [Cloud-specific annotations][expose-annotate].

**1. Install your chosen Ingress controller**

**2. Update the ingress configuration in your `values.yaml`**

```yaml
ingress:
  provision: true
  host: proxy.example.com
  ingressClassName: <your-ingress-class>
  annotations:
    # Add your controller's TLS passthrough annotations
  podLabels:
    # Labels matching your controller's pods
  namespaceLabels:
    # Labels matching your controller's namespace
```

**3. Upgrade Spaces**

```bash
helm upgrade spaces oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version ${SPACES_VERSION} \
  --namespace upbound-system \
  -f values.yaml \
  --wait
```

**4. Get the new load balancer address**

```bash
kubectl get svc -n <controller-namespace> <controller-service> -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

**5. Validate before switching DNS**

Test connectivity using `--connect-to` so traffic reaches the new controller
before you change DNS:

```bash
CONTROLLER_LB=$(kubectl get svc -n <controller-namespace> <controller-service> -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl --connect-to "${SPACES_ROUTER_HOST}:443:${CONTROLLER_LB}:443" "https://${SPACES_ROUTER_HOST}/version"
# Expected: 401 Unauthorized (routing works, auth required)
```

**6. Update your DNS record** to point to the new load balancer address.

**7. Uninstall ingress-nginx**

```bash
helm uninstall ingress-nginx --namespace ingress-nginx
```

<!-- vale Google.Headings = NO -->
## Migrate while on Spaces 1.15 or earlier
<!-- vale Google.Headings = YES -->

Choose your migration option:

| Option | When to use |
|--------|-------------|
| [Gateway API](#gateway-api-spaces-110) | Already using Gateway API or need shared gateway |
| [Traefik](#traefik-or-alternative-ingress-controller) | Migrate from nginx Ingress to alternative controller |

Export your current Helm values to a file (or use your existing values file if
stored in Git):

```bash
helm get values spaces -n upbound-system -o yaml > values.yaml
```

<!-- vale Google.Headings = NO -->
### Gateway API (Spaces 1.10+)
<!-- vale Google.Headings = YES -->

Gateway API support has been available since Spaces 1.10. See [Gateway API
Configuration][gateway-api-config] for detailed setup instructions.

:::note
Pre-1.16 Spaces doesn't support running Ingress and Gateway API
simultaneously. This migration requires switching over in a single upgrade,
which causes brief downtime during DNS propagation.
:::


**1. Install a gateway API controller**

Install a Gateway API implementation that supports TLS passthrough and
`TLSRoute`.

The following example uses Envoy Gateway:

```bash
export ENVOY_GATEWAY_VERSION=<version> # Example: v1.2.4

helm -n envoy-gateway-system upgrade --install --wait --wait-for-jobs \
  --timeout 300s --create-namespace envoy-gateway \
  oci://docker.io/envoyproxy/gateway-helm \
  --version "${ENVOY_GATEWAY_VERSION}"
```

**2. Create EnvoyProxy and GatewayClass**

Create an `EnvoyProxy` resource, then the `GatewayClass` that references it.

<CodeBlock cloud="aws">

```bash
kubectl apply -f - <<EOF
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: EnvoyProxy
metadata:
  name: spaces-proxy-config
  namespace: envoy-gateway-system
spec:
  provider:
    type: Kubernetes
    kubernetes:
      envoyService:
        annotations:
          service.beta.kubernetes.io/aws-load-balancer-type: external
          service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing
          service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
EOF
```

</CodeBlock>

<CodeBlock cloud="gcp">

```bash
kubectl apply -f - <<EOF
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: EnvoyProxy
metadata:
  name: spaces-proxy-config
  namespace: envoy-gateway-system
spec:
  provider:
    type: Kubernetes
    kubernetes:
      envoyService:
        annotations:
          cloud.google.com/l4-rbs: enabled
EOF
```

</CodeBlock>

<CodeBlock cloud="azure">

```bash
kubectl apply -f - <<EOF
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: EnvoyProxy
metadata:
  name: spaces-proxy-config
  namespace: envoy-gateway-system
spec:
  provider:
    type: Kubernetes
    kubernetes:
      envoyService:
        annotations: {}
EOF
```

</CodeBlock>

```bash
kubectl apply -f - --server-side <<EOF
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: spaces
spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller
  parametersRef:
    group: gateway.envoyproxy.io
    kind: EnvoyProxy
    name: spaces-proxy-config
    namespace: envoy-gateway-system
EOF
```

**3. Update your Helm values**

```yaml
ingress:
  provision: false

gatewayAPI:
  host: proxy.example.com  # Must match your current ingress.host
  gateway:
    provision: true
    name: spaces
    className: spaces  # Must match your GatewayClass name
  spacesRouterRoute:
    provision: true
  # Labels for NetworkPolicy - must match your gateway controller's pods
  podLabels:
    app.kubernetes.io/name: envoy
    app.kubernetes.io/component: proxy
    app.kubernetes.io/managed-by: envoy-gateway
  namespaceLabels:
    kubernetes.io/metadata.name: envoy-gateway-system
```

**4. Upgrade the Spaces Helm release**

Add the values from step 3 to your existing `values.yaml`, set
`gatewayAPI.host` to your gateway hostname (for example, `${GATEWAY_HOSTNAME}`).

Then upgrade using the values file:

```bash
helm -n upbound-system upgrade spaces \
  oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version "${SPACES_VERSION}" \
  -f values.yaml \
  --wait
```

**5. Restart spaces-router (optional)**

If the `gatewayAPI.host` value differs from the previous `ingress.host` value,
restart the spaces-router pod to regenerate the certificate with the correct
SAN:

```bash
kubectl -n upbound-system rollout restart deployment spaces-router
kubectl -n upbound-system rollout status deployment spaces-router
```

**6. Get the Gateway address**

After the controller has programmed the Gateway (check that it shows `Accepted` and `Programmed` in
`kubectl get gateway -n upbound-system spaces -o yaml`), get its address:

```bash
kubectl get gateway -n upbound-system spaces \
  -o jsonpath='{.status.addresses[0].value}'
```

Point your DNS (for example, `SPACES_ROUTER_HOST`) to this address. Ensure
`gatewayAPI.host` in your values is that hostname (the name that resolves to
this address).

**7. Verify connectivity**

```bash
curl -v "https://${SPACES_ROUTER_HOST}/version"
# Expected: 401 Unauthorized (routing works, auth required)
```

**8. Uninstall ingress-nginx**

```bash
helm uninstall ingress-nginx --namespace ingress-nginx
```

### Traefik (or alternative ingress controller)

Traefik can pick up the existing nginx Ingress via
`--providers.kubernetesIngressNGINX`. See the [Traefik migration
guide][traefik-migrate] for details.

**1. Install Traefik with nginx Ingress provider**

```bash
helm repo add traefik https://traefik.github.io/charts
helm repo update
helm upgrade --install traefik traefik/traefik \
  --create-namespace --namespace traefik \
  --set 'service.type=LoadBalancer' \
  --set 'additionalArguments={--providers.kubernetesIngressNGINX}' \
  --wait
```
<!-- vale gitlab.Uppercase = NO -->
:::tip
Configure Traefik's Service with NLB annotations. See
[Cloud-specific annotations][expose-annotate].
:::
<!-- vale gitlab.Uppercase = YES -->

**2. Validate before switching DNS**

```bash
# Get Traefik load balancer address
TRAEFIK_LB=$(kubectl get svc -n traefik traefik -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Test connectivity using --connect-to to route to Traefik
curl --connect-to "${SPACES_ROUTER_HOST}:443:${TRAEFIK_LB}:443" "https://${SPACES_ROUTER_HOST}/version"
# Expected: 401 Unauthorized (routing works, auth required)
```

**3. Update DNS to point to Traefik**

```bash
kubectl get svc -n traefik traefik -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Update your DNS record to this address. For gradual migration, use weighted DNS routing.

**4. Preserve the nginx IngressClass before uninstalling ingress-nginx**

```bash
helm upgrade ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx \
  --reuse-values \
  --set-json 'controller.ingressClassResource.annotations={"helm.sh/resource-policy": "keep"}'
```

**5. Uninstall ingress-nginx**

```bash
helm uninstall ingress-nginx --namespace ingress-nginx
```

Keep `ingress.provision: true` so the Spaces chart continues to manage the
Ingress resource. Traefik picks it up via the nginx provider.

## Verification

After migration, verify connectivity:

```bash
curl -v "https://${SPACES_ROUTER_HOST}/version"
# Expected: 401 Unauthorized
```

If you need to roll back, reinstall ingress-nginx, set `ingress.provision: true`
(and your previous ingress values) in Helm values, then upgrade Spaces again.

[envoy-install]: https://gateway.envoyproxy.io/docs/install/
[envoy-proxy]: https://gateway.envoyproxy.io/latest/tasks/operations/customize-envoyproxy/
[spaces-install]: /self-hosted-spaces/howtos/self-hosted-spaces-deployment/
[traefik-migrate]: https://doc.traefik.io/traefik/migrate/nginx-to-traefik/
[spaces-deploy]: /self-hosted-spaces/howtos/self-hosted-spaces-deployment/
[k8s-announce]: https://www.kubernetes.dev/blog/2025/11/12/ingress-nginx-retirement/
[expose]: /self-hosted-spaces/howtos/ingress/
[expose-annotate]: /self-hosted-spaces/howtos/ingress/#cloud-specific-annotations
[gateway-api]: https://gateway-api.sigs.k8s.io/
[gateway-api-config]: /self-hosted-spaces/howtos/ingress/#gateway-api
