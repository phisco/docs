---
title: 1. Install the Hub
sidebar_position: 2
pagination_prev: null
pagination_next: null
---
import CardGrid from '@site/src/components/CardGrid';
import GetUpboundHero from '@site/src/components/GetUpboundHero';


<!-- vale gitlab.FutureTense = NO -->
This three-part quickstart runs Upbound on your laptop. Part one installs the Hub and the Console. [Part
two][parttwo] connects a second control plane. [Part three][partthree] creates a
managed resource and watches it show up in the Hub. 
<!-- vale gitlab.FutureTense = YES -->

This process takes up to 20 minutes and runs on local kind clusters. At any
point, you can cleanly uninstall everything you created.

<!-- vale Google.Headings = NO -->
<!-- vale Microsoft.Headings = NO -->
## What the Hub does
<!-- vale Microsoft.Headings = YES -->
<!-- vale Google.Headings = YES -->

The Hub gives you an API and Console for control planes you already run. Register
your control planes with the Hub through `hub-connector` and see all your
resources across every control plane in one place.

UXP is Upbound's Crossplane distribution, adding a secrets proxy and backup and
restore. Spaces run many control planes on shared infrastructure instead of one
cluster each. This quickstart uses UXP in part three.

## Prerequisites

Before you begin, make sure you have:
- `kind`
- `kubectl`
- `helm` version `v3.8.0` or later
- the [up CLI][up] to install UXP.

<!-- vale Google.Units = NO -->
<!-- vale Google.Ordinal = NO -->
:::important
The Hub installation in this quickstart is free to try from July
31st, 2026 to October 29th, 2026.
:::
<!-- vale Google.Units = YES -->
<!-- vale Google.Ordinal = YES -->

## Create a cluster

The Hub runs on a Kubernetes cluster. Create a local one with kind.

Demo mode publishes the Hub gateway on node port `30443`. kind runs your node as
a container, so map that port to `8443` on your machine when you create the
cluster.

```shell
kind create cluster --name hub-quickstart --config - <<'EOF'
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: hub-quickstart
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30443
        hostPort: 8443
        protocol: TCP
EOF
```
<!-- vale Google.Headings = NO -->
## Install the Hub
<!-- vale Google.Headings = YES -->

Install the Hub chart in demo mode. Demo mode bundles the supporting
infrastructure a production install expects you to bring yourself.

```shell
helm upgrade --install hub oci://xpkg.upbound.io/upbound/hub \
  --namespace hub --create-namespace \
  --version 1.0.0 \
  --set global.demo.enabled=true \
  --wait
```

### What the chart installs

Every Hub install creates three components in the `hub` namespace:

| Component | What it does |
| --- | --- |
| `hub-core` | The Hub API, plus a migration job that prepares its database |
| `hub-connector` | Registers this cluster's control planes with the Hub |
| `hub-webui` | The Console |

`global.demo.enabled=true` adds the rest of the stack:

| Component | What it does | In a production install |
| --- | --- | --- |
| Keycloak | Identity provider behind Console login | Point the Hub at your own OIDC provider |
| PostgreSQL | Database for `hub-core` | Supply your own PostgreSQL instance |
| An endpoint secured with TLS | Publishes the Hub at `hub.127.0.0.1.nip.io` with a self-signed certificate | Use your own hostname, load balancer, and certificate |
| Demo users and their RBAC bindings | Lets you sign in and compare permission levels | Map your own users and groups |

<!-- vale write-good.Passive = NO -->
:::warning
The demo PostgreSQL writes to an `emptyDir`, so its pod losing its node loses
your Hub data. Demo mode is for trying the Hub out. Don't run it in production.
:::

<!-- vale write-good.Passive = YES -->

<!-- vale Google.Headings = NO -->
<!-- vale Microsoft.Headings = NO -->
## Check out Insights in the Console

<!-- vale Microsoft.Headings = YES -->
<!-- vale Google.Headings = YES -->

The port mapping from the `kind create cluster` step already publishes the
Console. Open your browser to the
[Hub dashboard](https://hub.127.0.0.1.nip.io:8443/dashboard).

The pages under **Explore** are [Insights][insights], the part of the Hub that
aggregates resources from every connected control plane and serves them through
one API. The rest of this quickstart uses Insights to watch each control plane
and resource you add.

<!-- vale write-good.Passive = NO -->
:::tip
This demo uses a self-signed certificate, so your browser warns you the site
isn't secure. In Firefox, select **Advanced** then **Accept the Risk and
Continue**. Chrome and Safari put the same option behind **Advanced**. Expect the
warning: the demo runs on your own machine with a certificate no authority
signed. A real Hub install uses a certificate you supply.
:::
<!-- vale write-good.Passive = YES -->

Sign in as `admin` with the password `admin`.

![The Console home page with quick access tiles and getting started links](/img/quickstart/console-home.png)

The [dashboard](https://hub.127.0.0.1.nip.io:8443/dashboard) counts the control
planes, resources, and definitions the Hub sees:

![The Hub dashboard showing control plane, resource, and definition counts](/img/quickstart/dashboard.png)

The [resources page](https://hub.127.0.0.1.nip.io:8443/explore/resources) lists
every resource the Hub sees, starting with the components the chart installed.
Filter or search by name to see one of them, like Keycloak, as the Deployment,
Pod, Service, and ConfigMap behind it:

![The resources page filtered to resources whose name contains keycloak](/img/quickstart/resources.png)

The [definitions page](https://hub.127.0.0.1.nip.io:8443/explore/definitions)
lists every API kind across the connected control planes. See
[Definitions][definitions] for what Insights correlates there:

![The definitions page listing CRDs and their API groups](/img/quickstart/definitions.png)

Demo mode also creates five other users, each with the password `password`, so
you can see how the Console changes with permission level:

| Username | Group |
| --- | --- |
| `admin` | admin |
| `editor-alice`, `editor-bob` | editor |
| `viewer-charlie`, `viewer-diana`, `viewer-eve` | viewer |

## Next steps

- [Part two][parttwo] to connect a second control plane to the Hub.
- [Insights][insights] for everything the **Explore** pages can do.
- [Builders workshop][workshop] for real cloud resources.
- Explore the [Hub][Hub] for the centralized management installation.


<CardGrid sections={[
  {
    title: 'Connect a second control plane',
    description: 'Create and connect a new control plane to your Hub cluster.',
    link: '/getstarted/quickstart/connect-a-second-control-plane'
  }
]} />


If you're stopping here, follow [Clean up](/getstarted/quickstart/create-resources#clean-up)
to delete what you created.

[up]: /manuals/cli/overview/
[insights]: /hub/products/insights/overview
[definitions]: /hub/products/insights/definitions
[parttwo]: /getstarted/quickstart/connect-a-second-control-plane
[partthree]: /getstarted/quickstart/create-resources
[Hub]: /hub/
[workshop]: /getstarted/builders-workshop/project-foundations
