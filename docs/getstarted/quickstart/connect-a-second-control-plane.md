---
title: 2. Connect a second control plane
sidebar_position: 3
pagination_prev: null
pagination_next: null
---
import CardGrid from '@site/src/components/CardGrid';
import GetUpboundHero from '@site/src/components/GetUpboundHero';

This section adds a second kind cluster to the Hub you installed in
[part one](install-the-hub.md), installs
`hub-connector` in it, and registers it with your running Hub.

## Create the second cluster

Create a new kind cluster the Hub API reaches over the
Docker network.

```shell
kind create cluster --name hub-quickstart-extra
```
<!-- vale Google.Headings = NO -->
## Expose the Hub API
<!-- vale Google.Headings = YES -->

:::important
A production install routes all traffic through a Gateway. This step exists only
because you're connecting two kind clusters.
:::

In the demo, `hub-core` and its token exchange are ClusterIP Services, reachable
only from inside the demo cluster. Add two NodePort Services alongside them so
the second cluster can connect.

```shell
kubectl --context kind-hub-quickstart -n hub apply -f - <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: hub-core-nodeport
spec:
  type: NodePort
  selector:
    app.kubernetes.io/name: hub-core
    app.kubernetes.io/instance: hub
  ports:
    - name: http
      port: 8080
      targetPort: http
      nodePort: 30080
---
apiVersion: v1
kind: Service
metadata:
  name: hub-core-token-exchange-nodeport
spec:
  type: NodePort
  selector:
    app.kubernetes.io/name: hub-core
    app.kubernetes.io/instance: hub
  ports:
    - name: token-exchange
      port: 8444
      targetPort: token-exchange
      nodePort: 30444
EOF
```

The selectors match the labels the `hub-core` Pods already carry, so these
Services route to the running API without changing the originals.


## Create a registration token

Every control plane gets its own registration token. The connector presents that
token the first time it contacts the Hub API, which tells the Hub which control
plane the connector speaks for.

1. Open the [control planes page](https://hub.127.0.0.1.nip.io:8443/infrastructure/control-planes)
   and sign in as `admin` / `admin`.
2. Register a ControlPlane in the `default` realm and name it `extra`.
3. Copy the registration token. The Hub displays it once.

![The Register a Control Plane dialog with realm and name fields](/img/quickstart/register-control-plane.png)

4. Save it for the next step:

```shell
export HUB_EXTRA_CTP_TOKEN=<paste-registration-token-here>
```

## Install hub-connector

The connector dials `hub-quickstart-control-plane:30080` for the API and
`:30444` for token exchange. Docker resolves that hostname to the demo cluster's
control plane container with its embedded DNS.

```shell
kubectl --context kind-hub-quickstart-extra create namespace hub

kubectl --context kind-hub-quickstart-extra -n hub create secret generic hub-connector-credentials \
  --from-literal=registrationToken="$HUB_EXTRA_CTP_TOKEN"

helm install hub-connector oci://xpkg.upbound.io/upbound/hub-connector \
  --kube-context kind-hub-quickstart-extra \
  --version 1.0.0 \
  --namespace hub \
  --set connector.hub.url=http://hub-quickstart-control-plane:30080 \
  --set connector.hub.tokenExchangeUrl=http://hub-quickstart-control-plane:30444 \
  --set connector.hub.allowInsecure=true \
  --set connector.credentials.existingSecretRef.name=hub-connector-credentials \
  --wait --timeout 2m
```

Refresh the Hub and confirm the second cluster is online.

Navigate to the [resources
page](https://hub.127.0.0.1.nip.io:8443/explore/resources). You can filter by
control plane to only lists resources in your `default` or `extra` control
plane.


In the [control planes page](https://hub.127.0.0.1.nip.io:8443/infrastructure/control-planes)
  lists `extra` next to `default` with a `Ready` status.

![The control planes page listing default and extra, both Ready](/img/quickstart/control-planes-list.png)

Select `extra` to see its resource counts and details:

![The extra control plane detail panel with claim, composite, and managed resource counts](/img/quickstart/control-plane-extra.png)

## Next steps

<CardGrid sections={[
  {
    title: 'Create a composite resource',
    description: 'Install UXP and a configuration. Then watch a resource reach the Hub.',
    link: '/getstarted/quickstart/create-resources'
  }
]} />

If you're stopping here, follow [Clean up](/getstarted/quickstart/create-resources#clean-up)
to delete what you created.


- [Builders workshop](/getstarted/builders-workshop/project-foundations) for real cloud
  resources.
- Explore the [Hub][Hub] for the centralized management installation.

[Hub]: /hub/
[workshop]: /getstarted/builders-workshop/project-foundations
