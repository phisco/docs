#!/usr/bin/env bash
set -euo pipefail

for bin in kind helm kubectl; do
  command -v "$bin" >/dev/null 2>&1 || { echo "error: '$bin' not found on PATH" >&2; exit 1; }
done

echo "==> Creating kind cluster 'crossplane-source'"
kind create cluster --name crossplane-source

echo "==> Installing Crossplane"
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm repo update
helm install crossplane crossplane-stable/crossplane \
  --namespace crossplane-system --create-namespace --wait

echo "==> Installing provider-nop and function-patch-and-transform"
kubectl apply -f - <<'EOF'
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-nop
spec:
  package: xpkg.upbound.io/crossplane-contrib/provider-nop:v0.4.0
---
apiVersion: pkg.crossplane.io/v1beta1
kind: Function
metadata:
  name: function-patch-and-transform
spec:
  package: xpkg.upbound.io/crossplane-contrib/function-patch-and-transform:v0.9.0
EOF
kubectl wait --for=condition=healthy provider/provider-nop --timeout=3m
kubectl wait --for=condition=healthy function/function-patch-and-transform --timeout=3m

echo "==> Defining a composite resource type"
kubectl apply -f - <<'EOF'
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xapps.example.upbound.io
spec:
  group: example.upbound.io
  names:
    kind: XApp
    plural: xapps
  versions:
    - name: v1alpha1
      served: true
      referenceable: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
---
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: xapps.example.upbound.io
spec:
  compositeTypeRef:
    apiVersion: example.upbound.io/v1alpha1
    kind: XApp
  mode: Pipeline
  pipeline:
    - step: create-nop
      functionRef:
        name: function-patch-and-transform
      input:
        apiVersion: pt.fn.crossplane.io/v1beta1
        kind: Resources
        resources:
          - name: nop
            base:
              apiVersion: nop.crossplane.io/v1alpha1
              kind: NopResource
              spec:
                forProvider:
                  conditionAfter:
                    - conditionType: Ready
                      conditionStatus: "True"
                      time: 5s
EOF

# The XRD needs a moment to establish the XApp CRD before the XR is accepted.
kubectl wait --for=condition=established crd/xapps.example.upbound.io --timeout=2m

echo "==> Creating one composite resource"
kubectl apply -f - <<'EOF'
apiVersion: example.upbound.io/v1alpha1
kind: XApp
metadata:
  name: sample-app
spec: {}
EOF

cat <<'EOF'

Crossplane is running on kind cluster 'crossplane-source' with one XApp
composite resource. This is your migration source.
EOF
