---
title: "Build Your Control Plane"
metaTitle: "Build Your Control Plane"
metaDescription: "Build a Control Plane on Upbound"
rank: 3
---

A control plane is an Upbound Universal Crossplane (UXP) installation that is
either managed by Upbound (_Hosted Control Plane_) and automatically attached to
an account, or managed by a user (_Self-Hosted Control Plane_) and manually
attached. Upbound Cloud supports both hosted and self-hosted control planes,
while Upbound Enterprise only supports self-hosted.

# Install UXP

While hosted control planes provide the easiest and lowest maintenance way to
get started, self-hosted control planes offer additional flexibility by allowing
the user to manage the cluster themselves. To demonstrate that flexibility,
we'll install UXP into a self-hosted Kubernetes cluster, then attach it to
Upbound.

UXP will connect to Upbound Cloud by default, so if running Upbound Enterprise,
you must specify an alternate URL in your `values.yaml`.

```bash
# This configuration assumes you are installing UXP in
# the same cluster where you installed Upbound Enterprise.
cat > "uxp-values.yaml" << EOF
upbound:
  apiURL: http://api-auth.upbound-enterprise:8080
  connectHost: nats.upbound-enterprise
  connectPort: 4222
  controlPlane:
    permission: edit

agent:
  config:
    debugMode: true
    args:
    - "--insecure"
    
xgql:
  config:
    debugMode: true
    args:
      - --enable-playground
EOF
```

Now we are ready to install:

```bash
# Use values.yaml if using Upbound Enterprise.
up uxp install -f uxp-values.yaml

# No values required if using Upbound Cloud.
up uxp install
```

A successful installation should look similar to the following:

```bash
kubectl -n upbound-system get pods -w

NAME                                       READY   STATUS    RESTARTS   AGE
crossplane-55dbc87955-5lvr4                1/1     Running   0          19s
crossplane-rbac-manager-65fdbbd9b8-jvbcm   1/1     Running   0          19s
upbound-bootstrapper-6df4d8bb94-62xt6      1/1     Running   0          19s
xgql-5dd69d564-qvwfw                       1/1     Running   0          19s

```

# Attach to Upbound

Now that UXP is installed, we can attach it to Upbound, which will give us a
dashboard to manage and view all infrastructure that we provision.

Run the following to attach your UXP instance to Upbound:

```bash
up ctp attach my-first-control-plane -a <org-name> | up uxp connect -
```

A successful attach should result in the Upbound Agent being started in
`upbound-system`:

```bash
kubectl -n upbound-system get pods -w

NAMESPACE            NAME                                         READY   STATUS    RESTARTS   AGE
upbound-system       crossplane-55dbc87955-tslk5                  1/1     Running   0          2m26s
upbound-system       crossplane-rbac-manager-65fdbbd9b8-nfvsk     1/1     Running   0          2m26s
upbound-system       upbound-agent-85d5fd8685-cq24f               1/1     Running   0          25s
upbound-system       upbound-bootstrapper-6df4d8bb94-2dz2b        1/1     Running   0          2m26s
upbound-system       xgql-5dd69d564-sgccx                         1/1     Running   0          2m26s
```

# UXP Overview

UXP enables platform teams to define new custom resources with schemas of your
choosing. We call these "composite resources" (XRs). Composite resources compose
a provider's managed resources -- high fidelity infrastructure primitives, like
an SQL instance or a firewall rule. In this page we'll walk through installing a
UXP Configuration.

UXP uses two special Crossplane resources to define and configure XRs:

- A `CompositeResourceDefinition` (XRD) _defines_ a new kind of XR , including
  its schema. An XRD may optionally _offer_ a claim (XRC).
- A `Composition` specifies which resources a XR will be composed of, and how
  they should be configured. You can create multiple `Composition` options for
  each composite resource.

XRDs and Compositions may be packaged and installed as a _configuration_. A
configuration is a [package] of composition configuration that can easily be
installed to UXP by creating a declarative `Configuration` resource. In the
examples below we will install a configuration that defines a new
`CompositePostgreSQLInstance` XR and `PostgreSQLInstance` XRC that takes a
single `storageGB` parameter, and creates a connection `Secret` with keys for
`username`, `password`, and `endpoint`. Let's get started!

# Install a Configuration

First we'll install the `Configuration` for AWS. To see how this `Configuration`
was construction, take a look at the [build a configuration] documentation.

```yaml
apiVersion: pkg.crossplane.io/v1
kind: Configuration
metadata:
  name: getting-started
spec:
  package: xpkg.upbound.io/upbound/getting-started:latest
```

```console
kubectl apply -f https://raw.githubusercontent.com/upbound/universal-crossplane/main/docs/getting-started/install.yaml

# Wait until the configuration and its dependencies are installed.
kubectl get pkg
```

# Add your Credentials

This `Configuration` is built on `provider-aws`, but there are additional
examples for other cloud provides in the [Crossplane documentation].

Using an AWS account with permissions to manage an RDS databases:

```console
# Write your credentials
AWS_PROFILE=default && echo -e "[default]\naws_access_key_id = $(aws configure get aws_access_key_id --profile $AWS_PROFILE)\naws_secret_access_key = $(aws configure get aws_secret_access_key --profile $AWS_PROFILE)" > creds.conf

# Save your credentials as a secret
kubectl create secret generic aws-creds -n upbound-system --from-file=creds=./creds.conf
```

We will create the following `ProviderConfig` object to configure credentials
for the AWS Provider:

```yaml
apiVersion: aws.crossplane.io/v1beta1
kind: ProviderConfig
metadata:
  name: default
spec:
  credentials:
    source: Secret
    secretRef:
      namespace: upbound-system
      name: aws-creds
      key: creds
```

```console
kubectl apply -f https://raw.githubusercontent.com/upbound/universal-crossplane/main/docs/getting-started/providerconfig.yaml
```

## Next Steps

You have now configured UXP with support for managing a `PostgreSQLInstance`!
Your app teams can now [deploy one] using `kubectl`.

[package]: https://crossplane.io/docs/master/concepts/packages.html
[Crossplane documentation]: https://crossplane.io/docs
[kubectl]: https://kubernetes.io/docs/tasks/tools/
[deploy one]: ../deploy-infrastructure
[build a configuration]: ../build-configuration