---
title: Manage external resources with providers
sidebar_position: 2
---
Upbound Crossplane is the AI-native distribution of Crossplane. Control planes
are the only way to build and support an autonomous infrastructure platform for
the age of autonomous systems, serving both humans and AI. Crossplane offers an
extensive library of managed resources you can use to manage almost any cloud
provider or cloud native software.

:::tip
This quickstart is suitable for users who want to manage external
services using ready-made custom resources.

For users who want to build workflows for templating resources and exposing
them as simplified resource abstraction, read the [Get Started
guide][composition]
:::


## Prerequisites

This quickstart takes around 10 minutes to complete. You should be familiar with
cloud concepts.

For this quickstart, you need:

- the [Upbound CLI][up] installed.
- a Docker-compatible container runtime installed on your system and running.
- an AWS account

## Create a local cluster

For this example, you need to create a local cluster with `kind` or a similar
Docker-compatible container runtime.

```shell
kind create cluster
```

## Install Upbound Crossplane

Install Upbound Crossplane on your local cluster with the `up` CLI:

```shell
up uxp install 
```

Upbound installs UXP on your local cluster via Helm chart.


## Install the provider

Upbound Crossplane provides a library of pre-built managed resources that you
can use to manage external services.

Create a new directory for this quickstart:

```shell
mkdir managed-resource-qs && cd managed-resource-qs
```

Create a new file called `provider.yaml` and install the Official AWS provider
for the S3 managed resource:

```yaml title="managed-resource-qs/provider.yaml"
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: crossplane-contrib-provider-aws-s3
spec:
  package: xpkg.upbound.io/upbound/provider-aws-s3:v2.0.0
```
Next, apply the provider to your local cluster:

```shell
kubectl apply --filename provider.yaml
```

A Crossplane provider installs support for a set of related managed resources.
The AWS S3 provider installs support for all the AWS S3 managed resources.

### Create provider credentials

With the provider installed, the control plane needs credentials to connect to
AWS. The provider needs credentials to create and manage AWS resources.
Providers use a Kubernetes secret to connect the credentials to the provider. 

Generate a new secret from your AWS key-pair. Review the [AWS
documentation][aws-documentation] for more information on how to generate AWS
access keys.

Create a new file called `aws-credentials.ini` and paste your
`aws_access_key_id` and `aws_secret_access_key`:

```ini
[default]
aws_access_key_id = 
aws_secret_access_key = 
```

Save the file.

Create a Kubernetes secret that references your `aws-credentials.ini` file:

```shell
kubectl create secret generic aws-secret \
  --namespace=crossplane-system \
  --from-file=creds=./aws-credentials.ini
```

### Configure the provider

Now that your cluster has access to your AWS credentials, you need to create a
`ProviderConfig` that tells the provider to load credentials from the secret.

Create a new file called `clusterproviderconfig.yaml` and paste the configuration
below:

```yaml
apiVersion: aws.m.upbound.io/v1beta1
kind: ClusterProviderConfig
metadata:
  name: default
spec:
  credentials:
    source: Secret
    secretRef:
      namespace: crossplane-system
      name: aws-secret
      key: creds
```

Save the file and apply the provider configuration:

```shell
kubectl apply --filename providerconfig.yaml
```

## Create a managed resource

Now that you've installed and configured the provider, you can create the managed
resource.

Create a new file called `bucket.yaml` and paste the configuration below:

```yaml
apiVersion: s3.aws.m.upbound.io/v1beta1
kind: Bucket
metadata:
  namespace: default
  generateName: crossplane-bucket-
spec:
  forProvider:
    region: us-east-2
```

Save the file and apply the managed resource to your control plane:

```shell
kubectl create -f bucket.yaml
```

Inspect your cluster to verify Crossplane created the bucket:

```shell
kubectl get buckets.s3.aws.m.upbound.io
```

## Clean up

When you're done with this guide, remember to delete your resources:

```shell
kubectl delete buckets.s3.aws.m.upbound.io crossplane-bucket-<your-bucket-name>
```

Delete your local cluster:

```shell
kind delete cluster
```


## Next steps

In this guide, you created a local Upbound Crossplane instance, and deployed
managed resources.

Next, learn more about how Crossplane can deploy cloud resources and manage
external services:

* [Perform an operation on a resource][operations]

[aws-documentation]: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html
[up]: /manuals/cli/overview
[marketplace]: https://marketplace.upbound.io
[functions]: /manuals/uxp/concepts/composition/composite-resource-definitions
[operations]: /manuals/uxp/concepts/operations/overview
[providers]:  /manuals/uxp/concepts/packages/providers
[composition]: /getstarted/builders-workshop/project-foundations


