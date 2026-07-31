---
title: Installing Hub
sidebar_position: 2
description: Install Hub with Helm against external Postgres and OIDC.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

A self-hosted Hub install needs a PostgreSQL database, an OIDC provider, and
ingress routes for the Hub services.

This page owns the values used to install the `hub` Helm chart. The previous pages set up those dependencies and tell you which values to
record.

## Prerequisites

Before starting, work through [the prerequisites page][prerequisites] and
confirm each item is ready. This page assumes you have:

- A Kubernetes cluster with a Gateway API or Ingress controller installed and a
  real CA-signed TLS certificate for the hostnames you intend to use
- DNS records for the hostnames `api.<your-domain>` and `ui.<your-domain>`
  pointing at the cluster's load balancer or Gateway address
- A provisioned PostgreSQL database, following [the databases
  overview][overview] and the provider page it links to
- An OIDC provider registered with Hub's callback URL
  `https://api.<your-domain>/oidc/callback`, with a group claim configured,
  following [the OIDC configuration page][oidc-configuration]

Those two pages each end with a table of values to record. Have both tables in
front of you before you start. Between them they supply every placeholder in
step 4:

| From the OIDC page | From the database page |
| --- | --- |
| `providerName` | Authentication mode (`password` or `iam`) |
| `issuerURL` | Database host and port |
| `clientID` | Database name and user |
| Client secret | `sslmode` |
| `groupsClaim` (if your provider deviates) | Password secret name and key, or AWS region and role ARN |
| Admin group or user names | |

## The chart reference

Hub installs from an umbrella chart at this OCI reference:

```bash
oci://xpkg.upbound.io/upbound/hub
```

Helm resolves the latest release when you don't pass `--version`. Add
`--version <version>` to pin a release, which is what you want in a production
pipeline so an upgrade is a deliberate change rather than a side effect of
running the command again.

## Install

### 1. Create the namespace

```bash
kubectl create namespace hub
```

The rest of this guide installs all Hub resources into `hub`. Substitute your
own namespace name if you prefer.

### 2. Create the Postgres credentials secret

Skip this step if you chose IAM authentication on the database page. IAM mode
stores no password, so it needs no Secret.

For password authentication, create a Secret holding the database password under
the key `password`:

```bash
kubectl -n hub create secret generic hub-core-postgres \
  --from-literal=password='<your-postgres-password>'
```

You reference this Secret from `values.yaml` in step 4 via
`hub-core.postgresql.auth.password.existingSecretRef`.

:::note
Hub doesn't require the Secret name `hub-core-postgres`. Any Secret in the same
namespace as the release works as long as the name and key match the
`existingSecretRef` fields you set in values.
:::

### 3. Create the OIDC client-secret secret

<!-- vale Microsoft.Adverbs = NO -->
Hub reads the OIDC client secret directly out of Helm values when it builds the
bootstrap configuration. To keep the client secret out of your `values.yaml`
file (and out of source control), pass it on the `helm install` command line via
`--set-file` or `--set`. Don't commit it. If your workflow requires the
value to live in a Kubernetes Secret you reconcile separately, create it now:
<!-- vale Microsoft.Adverbs = YES -->

```bash
kubectl -n hub create secret generic hub-core-oidc \
  --from-literal=clientSecret='<your-oidc-client-secret>'
```

You can then pass the value to Helm at install time by extracting it from the
Secret:

```bash
OIDC_CLIENT_SECRET=$(kubectl -n hub get secret hub-core-oidc \
  -o jsonpath='{.data.clientSecret}' | base64 -d)
```

The `helm install` command in step 5 uses the `OIDC_CLIENT_SECRET` variable.

### 4. Assemble `values.yaml`

Save the following as `values.yaml`.
It carries the ingress and OIDC settings, and you complete it with the Postgres
block for the authentication mode you chose. The template includes only the keys
you need to change for a self-hosted install. Defaults cover everything else.

```yaml
global:
  gateway:
    enabled: true
    # Set to true if you want this chart to render the Gateway
    # resource. Leave false when you manage the Gateway separately
    # and only want HTTPRoutes attached to it.
    create: false
    # Required when create=true. Identifies the GatewayClass your
    # cluster's controller has registered (for example "envoy",
    # "istio", "cilium").
    gatewayClassName: ""
    # Apex domain Hub is served from. Subcharts compose
    # <subdomain>.<domain> hostnames from this value.
    domain: <your-domain>
    # parentRef points at an existing Gateway. Remove these values
    # below if you set create=true.
    parentRef:
      name: <your-gateway-name>
      namespace: <your-gateway-namespace>
    listeners:
      https:
        enabled: true
        port: 443
        tls:
          mode: Terminate
          # TLS certificate Hub serves on api.<your-domain> and
          # ui.<your-domain>. Reference a Secret of type
          # kubernetes.io/tls in the Gateway's namespace.
          certificateRefs:
            - kind: Secret
              name: <your-tls-secret>

hub-core:
  api:
    # Externally reachable base URL for hub-core. Used to compose
    # the OIDC callback URI (<externalURL>/oidc/callback) and
    # surfaced to hub-webui for browser redirects. Must match the
    # redirect URI registered with your provider.
    externalURL: https://api.<your-domain>

    # Values recorded on the OIDC configuration page.
    sampleEmailBasedOIDCConfig:
      providerName: oidc
      issuerURL: <your-oidc-issuer-url>
      clientID: <your-oidc-client-id>
      # Client secret is injected on the helm install command line
      # via --set in step 5, not committed here.
      clientSecret: ""
      # Optional. Restrict logins to a single email domain.
      allowedDomain: <your-email-domain>

  # First administrators. Without at least one entry here, the first
  # user to log in has no permissions and no way to grant any.
  bootstrap:
    admins:
      - kind: Group
        name: "oidc:<your-admin-group-name>"
```

Now append the Postgres block for your authentication mode. Both forms nest
under the same `hub-core:` key as the block above.

<Tabs>
<TabItem value="password" label="Password authentication" default>

```yaml
hub-core:
  postgresql:
    # Either set connectionString OR host + database + user + auth.
    # Leave connectionString empty to use the structured form below.
    connectionString: ""
    host: <your-postgres-host>
    port: 5432
    database: hub
    user: hub
    # Set to require (or stricter) when your database enforces TLS.
    sslmode: require
    auth:
      mode: password
      password:
        # Reference to the Secret created in step 2.
        existingSecretRef:
          name: hub-core-postgres
          key: password
```

</TabItem>
<TabItem value="iam" label="AWS IAM authentication">

```yaml
hub-core:
  api:
    serviceAccount:
      create: true
      # IRSA only. Omit this annotation when using EKS Pod Identity.
      annotations:
        eks.amazonaws.com/role-arn: arn:aws:iam::<account-id>:role/hub-core

  postgresql:
    host: <your-rds-endpoint>
    port: 5432
    database: hub
    user: hub
    sslmode: require
    auth:
      mode: iam
      cloud: aws
      aws:
        region: <your-aws-region>
```

IAM mode needs no password Secret, so step 2 doesn't apply. The chart forces
`sslmode=require` in this mode and ignores `connectionString`. See [AWS
RDS][aws-rds] for the IAM role, policy, and database-role setup these values
depend on.

</TabItem>
</Tabs>

Notes on the template:

- `global.gateway.create` controls whether the chart owns the Gateway resource.
  If your platform team already manages a shared Gateway, leave `create: false`
  and point `parentRef` at it. If you want the chart to render a dedicated
  Gateway, set `create: true` and supply `gatewayClassName`.
- `hub-core.api.externalURL` must match the hostname clients (browsers and CLI
  tools) use to reach `hub-core`.
- `hub-core.bootstrap.admins` accepts `Group` and `User` entries. Group names
  come from your provider's group claim and user names are the user's email,
  both prefixed with `<providerName>:`. From this one list the chart renders an
  `OrganizationRoleBinding` bound to `org-admin` and a `RealmRoleBinding` bound
  to `realm-admin` on the `default` realm.

:::note
The chart exposes many more values than the ones shown here. See the values
reference for the full surface. Anything not set in
`values.yaml` falls back to the chart default.
:::

### 5. Install the chart

Install the chart with `values.yaml` and the OIDC client secret passed inline:

```bash
helm install hub oci://xpkg.upbound.io/upbound/hub \
  --namespace hub \
  --values values.yaml \
  --set hub-core.api.sampleEmailBasedOIDCConfig.clientSecret="$OIDC_CLIENT_SECRET"
```

If you didn't extract the OIDC client secret into a shell variable in step 3,
substitute the literal value (quoted) for `$OIDC_CLIENT_SECRET`.

Wait for the install to finish and for all Pods to become Ready:

```bash
kubectl -n hub wait --for=condition=ready pod --all --timeout=5m
```

On first install, `hub-core` runs a migration init container against your
Postgres database before the main container starts. The wait above blocks until
that migration completes.

## Verify the Install

Confirm Hub is up and you can reach it before registering any control planes.

Check that all Hub Pods are Ready:

```bash
kubectl -n hub get pods
```

You should see Ready replicas for `hub-core` and `hub-webui`. The umbrella chart includes the `hub-connector`
Deployment, but `hub-core` itself doesn't use it. It activates only when you install a connector on an observed cluster.

Open `https://ui.<your-domain>` in a browser. The browser should redirect to your
OIDC provider for login, then returned to the Hub UI.

### Confirm admin access

Signing in as a member of the group you listed in `hub-core.bootstrap.admins`
gives you organization and realm admin rights immediately. The chart rendered
both bindings during install.

<!-- vale Google.Quotes = NO -->
If login completes but the UI shows "no permissions", confirm:
<!-- vale Google.Quotes = YES -->

1. The group in your OIDC token matches an entry in
   `hub-core.bootstrap.admins`, including the `<providerName>:` prefix.
2. Your OIDC provider is sending the group claim. Inspect the JWT at the
   provider's debug endpoint or in your browser's network tab.

To grant access beyond these first administrators, see [RBAC and OIDC group
mapping][rbac].

A fresh install has no registered control planes. The next section adds one.

## Configure

With admin access confirmed, register your first ControlPlane and mint a
registration token for its connector.

### Register the first control plane

Apply a ControlPlane resource for the cluster (or clusters) you register a
`hub-connector` against. The example below registers a `production` ControlPlane
in the `default` realm and trusts your OIDC IdentityProvider for user
lookups on that ControlPlane.

Save as `bootstrap-controlplane.yaml`:

<!--- TODO(nickthomson): set up connection to the hub API server to apply resources --->

```yaml
apiVersion: hub.upbound.io/v1alpha1
kind: ControlPlane
metadata:
  name: production
  namespace: default
spec:
  identityProviders:
    - name: oidc
      userMappingType: Exact
```

Apply it:

```bash
kubectl apply -f bootstrap-controlplane.yaml
```

The `spec.identityProviders[].name` value must match the `providerName` you set
in `hub-core.api.sampleEmailBasedOIDCConfig.providerName`. Hub uses that
IdentityProvider to resolve users referenced by role bindings on this
ControlPlane.

### Mint a registration token

After you create the ControlPlane, mint a registration token for it. The token
is what `hub-connector` presents when it first contacts `hub-core`:

```bash
kubectl create -f - <<'EOF'
apiVersion: hub.upbound.io/v1alpha1
kind: RegistrationToken
metadata:
  generateName: production-
  namespace: default
spec:
  controlPlaneRef:
    name: production
EOF
```
<!-- vale write-good.Passive = NO -->
Read the issued token off the resource's status and store it somewhere safe. The
token is shown once. You hand it to the `hub-connector` install on the
observed cluster. The standalone connector install pattern carries over here, with the
connector's `connector.hub.url` pointing at your gateway instead of a
Docker-network address.
<!-- vale write-good.Passive = YES -->

:::note
The chart also accepts `hub-core.bootstrap.files` for delivering ControlPlanes
and other Hub objects as part of the Helm release. Use it when you want the
control plane inventory version-controlled alongside the release rather than
applied by hand.
:::

Refresh `https://ui.<your-domain>`. The `production` ControlPlane appears in the
ControlPlane list, with no resources yet since it has no connector attached.

## Next step

You have a working self-hosted Hub. Before letting traffic that matters depend
on it, work through [the production overview][production-overview] for
sizing, high availability, autoscaling, RBAC, and upgrade guidance.

To attach a control plane, install the standalone `hub-connector` chart on the
observed cluster with the registration token you minted above. For self-hosted installs the connector's `connector.hub.url` and
`connector.hub.tokenExchangeUrl` point at the public hostname of your gateway
instead, and `connector.hub.allowInsecure` stays at its default of `false`.

[aws-rds]: /hub/howtos/databases/aws-rds
[oidc-configuration]: /hub/howtos/oidc-configuration
[overview]: /hub/howtos/databases/overview
[prerequisites]: /hub/howtos/prerequisites
[production-overview]: /hub/howtos/production-overview
[rbac]: /hub/howtos/rbac
