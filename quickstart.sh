#!/usr/bin/env bash
set -euo pipefail

for bin in kind helm kubectl up; do
  command -v "$bin" >/dev/null 2>&1 || { echo "error: '$bin' not found on PATH" >&2; exit 1; }
done

echo "==> Creating KIND cluster 'quickstart'"
kind create cluster --name quickstart

echo "==> Logging in to Upbound"
up login

echo "==> Installing the Insights platform (demo)"
helm upgrade --install hub oci://xpkg.upbound.io/upbound/hub \
  -n hub --create-namespace --set global.demo.enabled=true --version 1.0.0-rc.1

echo "==> Waiting for Insights components"
kubectl -n hub wait --for=condition=ready pod --all --timeout=5m

echo "==> Forwarding the Console gateway to https://hub.127.0.0.1.nip.io:8443"
gateway_svc=$(kubectl -n hub get svc -l gateway.envoyproxy.io/owning-gateway-name=hub-gateway -o jsonpath='{.items[0].metadata.name}')
kubectl -n hub port-forward "svc/${gateway_svc}" 8443:8443 &
pf_pid=$!
trap 'kill "$pf_pid" 2>/dev/null || true' EXIT

echo "==> Installing UXP (Crossplane)"
up uxp install
kubectl -n crossplane-system wait --for=condition=ready pod --all --timeout=5m

echo "==> Initializing project 'my-webapp'"
up project init -t project-template-k8s-webapp -l python my-webapp

echo "==> Running the project on the current cluster"
cd my-webapp
up project run --use-current-context

cat <<'EOF'

Hub: https://hub.127.0.0.1.nip.io:8443  (login admin / admin)
Hub port-forward running. When you're done with this quickstart, press Ctrl+C to stop it.
EOF

wait "$pf_pid"
