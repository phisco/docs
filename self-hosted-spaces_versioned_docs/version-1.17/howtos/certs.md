---
title: Istio Ingress Gateway With Custom Certificates
sidebar_position: 20
description: Install self hosted spaces using istio ingress gateway in a Kind cluster
---

import CodeBlock from '@theme/CodeBlock';
import { versions } from '@site/src/components/Version.js';

:::important
Prerequisites

- Spaces Token available in a file
- `docker login xpkg.upbound.io -u <TOKEN_ACCESS_ID> -p <TOKEN>`
- [`istioctl`][istioctl] installation
- `jq` installation
:::

This document describes the installation of a self hosted space on an example `kind`
cluster along with Istio Ingress Gateway and certificates. The service mesh and certificates
installation is transferable to self hosted spaces in arbitrary clouds.

## Create a kind cluster

```shell
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

## Install cert-manager

```shell
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.16.2/cert-manager.yaml
```

<!-- vale Google.Headings = NO -->
## Install Istio
<!-- vale Google.Headings = YES -->

<!-- vale gitlab.UnclearAntecedent = NO -->
:::important
This is an example and not recommended for use in production.
:::
<!-- vale gitlab.UnclearAntecedent = YES -->

1. Create the `istio-values.yaml` file

```shell
cat > istio-values.yaml << 'EOF'
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  hub: gcr.io/istio-release
  components:
    ingressGateways:
      - enabled: true
        name: istio-ingressgateway
        k8s:
          nodeSelector:
            ingress-ready: "true"
          overlays:
            - apiVersion: apps/v1
              kind: Deployment
              name: istio-ingressgateway
              patches:
                - path: spec.template.spec.containers.[name:istio-proxy].ports
                  value:
                    - containerPort: 8080
                      hostPort: 80
                    - containerPort: 8443
                      hostPort: 443
EOF
```

2. Install istio via `istioctl`

```shell
istioctl install -f istio-values.yaml
```

## Create a self-signed Certificate via cert-manager

:::important
This Certificate manifest creates a self-signed certificate for a proof of concept
environment and isn't recommended for production use cases.
:::

1. Create the upbound-system namespace

```shell
kubectl create namespace upbound-system
```

2. Create a self-signed certificate

```shell
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned-issuer
spec:
  selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: example-tls-secret
  namespace: upbound-system
spec:
  secretName: example-tls-secret
  issuerRef:
    name: selfsigned-issuer
    kind: ClusterIssuer
  dnsNames:
  # Replace with your Spaces cluster ingress hostname
  - proxy.upbound-127.0.0.1.nip.io
EOF
```

<!-- vale Google.Headings = NO -->
## Create an Istio Gateway and VirtualService
<!-- vale Google.Headings = YES -->

<!-- vale Upbound.Spelling = NO -->
<!-- ignore passthrough -->
Configure an Istio Gateway and VirtualService to use TLS passthrough.
<!-- vale Upbound.Spelling = YES -->

```shell
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1
kind: Gateway
metadata:
  name: spaces-gateway
  namespace: istio-system
spec:
  selector:
    istio: ingressgateway
  servers:
  - hosts:
    # Replace with your Spaces cluster ingress hostname
    - proxy.upbound-127.0.0.1.nip.io
    port:
      name: tls
      number: 443
      protocol: TLS
    tls:
      mode: PASSTHROUGH
---
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: spaces-router
  namespace: istio-system
spec:
  gateways:
  - spaces-gateway
  hosts:
  # Replace with your Spaces cluster ingress hostname
  - proxy.upbound-127.0.0.1.nip.io
  tls:
  - match:
    - sniHosts:
      # Replace with your Spaces cluster ingress hostname
      - proxy.upbound-127.0.0.1.nip.io
    route:
    - destination:
        host: spaces-router.upbound-system.svc.cluster.local
        port:
          number: 8443
EOF
```

## Install spaces

1. Create the Spaces values file

```shell
cat > spaces-values.yaml << 'EOF'
# Configure spaces-router to use the TLS secret created by cert-manager.
externalTLS:
  tlsSecret:
    name: example-tls-secret
  caBundleSecret:
    name: example-tls-secret
    key: ca.crt
ingress:
  provision: false
  # Allow Istio Ingress Gateway to communicate to the spaces-router
  namespaceLabels:
    kubernetes.io/metadata.name: istio-system
  podLabels:
    app: istio-ingressgateway
    istio: ingressgateway
EOF
```

2. Set the required environment variables

<CodeBlock language="shell">
{`# Update these according to your account/token file
export SPACES_TOKEN_PATH=<token file path>
export UPBOUND_ACCOUNT=<account>
# Replace SPACES_ROUTER_HOST with your Spaces ingress hostname
export SPACES_ROUTER_HOST="proxy.upbound-127.0.0.1.nip.io"
export SPACES_VERSION="${versions.spaces}"`}
</CodeBlock>

3. Create an image pull secret for Spaces

```shell
kubectl -n upbound-system create secret docker-registry upbound-pull-secret \
 --docker-server=https://xpkg.upbound.io \
 --docker-username="$(jq -r .accessId $SPACES_TOKEN_PATH)" \
 --docker-password="$(jq -r .token $SPACES_TOKEN_PATH)"
```

4. Install the Spaces helm chart

```shell
# Login to xpkg.upbound.io
jq -r .token $SPACES_TOKEN_PATH | helm registry login xpkg.upbound.io -u $(jq -r .accessId $SPACES_TOKEN_PATH) --password-stdin

# Install spaces helm chart
helm -n upbound-system upgrade --install spaces \
 oci://xpkg.upbound.io/spaces-artifacts/spaces \
 --version "${SPACES_VERSION}" \
 --set "ingress.host=${SPACES_ROUTER_HOST}" \
 --set "account=${UPBOUND_ACCOUNT}" \
 --set "authentication.hubIdentities=true" \
 --set "authorization.hubRBAC=true" \
 --wait -f spaces-values.yaml
```

## Validate the installation

Successful access of the `up` command to interact with your self hosted space validates the
certificate installation.

- `up ctx .`

You can also issue control plane creation, list and deletion commands.

- `up ctp create cert-test`
- `up ctp list`
- `up ctx disconnected/kind-kind/default/cert-test && kubectl get namespace`
- `up ctp delete cert-test`

:::note
If `up` can't connect to your control plane, follow [this guide to create a new profile][up-profile].
:::

## Troubleshooting

Examine your certificate with `openssl`:

```shell
openssl s_client -connect proxy.upbound-127.0.0.1.nip.io:443 -showcerts
```

[istioctl]: https://istio.io/latest/docs/ops/diagnostic-tools/istioctl/
[up-profile]: /manuals/cli/howtos/profile-config/
