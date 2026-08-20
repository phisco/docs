---
title: Shared Secrets Workload ID
weight: 1
description: Configure workload identity for Spaces Shared Secrets
---
import GlobalLanguageSelector, { CodeBlock } from '@site/src/components/GlobalLanguageSelector';

<GlobalLanguageSelector />

<Business />

<CodeBlock cloud="aws">

Workload-identity authentication lets you use access policies to grant your
self-hosted Space cluster access to your cloud providers. Workload identity
authentication grants temporary AWS credentials to your Kubernetes pod based on
a service account. Assigning IAM roles and service accounts allows the pod to
assume the IAM role dynamically and much more securely than static credentials.

This guide walks you through creating an IAM trust role policy and applying it to your EKS
cluster for secret sharing with Kubernetes.

</CodeBlock>

<CodeBlock cloud="azure">

Workload-identity authentication lets you use access policies to grant your
self-hosted Space cluster access to your cloud providers. Workload identity
authentication grants temporary Azure credentials to your Kubernetes pod based on
a service account. Assigning managed identities and service accounts allows the pod to
authenticate with Azure resources dynamically and much more securely than static credentials.

This guide walks you through creating a managed identity and federated credential for your AKS
cluster for shared secrets in your Space cluster.

</CodeBlock>

<CodeBlock cloud="gcp">

Workload-identity authentication lets you use access policies to grant your
self-hosted Space cluster access to your cloud providers. Workload identity
authentication grants temporary GCP credentials to your Kubernetes pod based on
a service account. Assigning IAM roles and service accounts allows the pod to
access cloud resources dynamically and much more securely than static
credentials.

This guide walks you through configuring workload identity for your GKE
cluster's Shared Secrets component.

</CodeBlock>

## Prerequisites

<!-- vale gitlab.FutureTense = NO -->
To set up a workload-identity, you'll need:
<!-- vale gitlab.FutureTense = YES -->

- A self-hosted Space cluster
- Administrator access in your cloud provider
- Helm and `kubectl`

<!-- vale Google.Headings = NO -->
## About the Shared Secrets component
<!-- vale Google.Headings = YES -->

<CodeBlock cloud="aws">

The External Secrets Operator (ESO) runs in each control plane's host namespace as `external-secrets-controller`. It needs to access
your external secrets management service like AWS Secrets Manager.

To configure your shared secrets workflow controller, you must:

* Annotate the Kubernetes service account to associate it with a cloud-side
  principal (such as an IAM role, service account, or enterprise application). The workload must then
  use this service account.
* Label the workload (pod) to allow the injection of a temporary credential set,
  enabling authentication.

</CodeBlock>

<CodeBlock cloud="azure">

The External Secrets Operator (ESO) component runs in each control plane's host
namespace as `external-secrets-controller`. It synchronizes secrets from
external APIs into Kubernetes secrets. Shared secrets allow you to manage
credentials outside your Kubernetes cluster while making them available to your
application

</CodeBlock>

<CodeBlock cloud="gcp">

The External Secrets Operator (ESO) component runs in each control plane's host
namespace as `external-secrets-controller`. It synchronizes secrets from
external APIs into Kubernetes secrets. Shared secrets allow you to manage
credentials outside your Kubernetes cluster while making them available to your
application

</CodeBlock>

## Configuration

<CodeBlock cloud="aws">

Upbound supports workload-identity configurations in AWS with IAM Roles for
Service Accounts or EKS pod identity association.

#### IAM Roles for Service Accounts (IRSA)

With IRSA, you can associate a Kubernetes service account in an EKS cluster with
an AWS IAM role. Upbound authenticates workloads with that service account as
the IAM role using temporary credentials instead of static role credentials.
IRSA relies on AWS `AssumeRoleWithWebIdentity` `STS` to exchange OIDC ID tokens with
the IAM role's temporary credentials. IRSA uses the `eks.amazon.aws/role-arn`
annotation to link the service account and the IAM role.

**Create an IAM role and trust policy**

First, create an IAM role with appropriate permissions to access AWS Secrets Manager:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
        "ssm:GetParameter"
      ],
      "Resource": [
        "arn:aws:secretsmanager:${YOUR_REGION}:${YOUR_AWS_ACCOUNT_ID}:secret:${YOUR_SECRET_PREFIX}*",
        "arn:aws:ssm:${YOUR_REGION}:${YOUR_AWS_ACCOUNT_ID}:parameter/${YOUR_PARAMETER_PREFIX}*"
      ]
    }
  ]
}
```

You must configure the IAM role trust policy with the exact match for each
provisioned control plane. An example of a trust policy for a single control
plane is below:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${YOUR_AWS_ACCOUNT_ID}:oidc-provider/${YOUR_OIDC_PROVIDER}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "<OIDC_PROVIDER>:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "<OIDC_PROVIDER>:sub": "system:serviceaccount:*:external-secrets-controller"
        }
      }
    }
  ]
}
```

**Configure the EKS OIDC provider**

Next, ensure your EKS cluster has an OIDC identity provider:

```shell
eksctl utils associate-iam-oidc-provider --cluster ${YOUR_CLUSTER_NAME} --approve
```

**Apply the IAM role**

In your control plane, pass the `--set` flag with the Spaces Helm chart
parameters for the shared secrets component:

```yaml
--set controlPlanes.sharedSecrets.serviceAccount.customAnnotations."eks\.amazonaws\.com/role-arn"="arn:aws:iam::${YOUR_AWS_ACCOUNT_ID}:role/${YOUR_ESO_ROLE_NAME}"
```

This command allows the shared secrets component to authenticate with your
dedicated IAM role in your EKS cluster environment.

#### EKS pod identities

Upbound also supports EKS Pod Identity configuration. EKS Pod Identities allow
you to create a pod identity association with your Kubernetes namespace, a
service account, and an IAM role, which allows the EKS control plane to
automatically handle the credential exchange.

**Create an IAM role**

First, create an IAM role with appropriate permissions to access AWS Secrets Manager:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
        "ssm:GetParameter"
      ],
      "Resource": [
        "arn:aws:secretsmanager:${YOUR_AWS_REGION}:${YOUR_AWS_ACCOUNT_ID}:secret:${YOUR_SECRET_PREFIX}*",
        "arn:aws:ssm:${YOUR_AWS_REGION}:${YOUR_AWS_ACCOUNT_ID}:parameter/${YOUR_PARAMETER_PREFIX}*"
      ]
    }
  ]
}
```

**Configure your Space with Helm**

When you install or upgrade your Space with Helm, add the shared secrets value:

```shell
helm upgrade spaces spaces-helm-chart \
  --set "sharedSecrets.enabled=true"
```

**Create a Pod Identity Association**

After Upbound provisions your control plane, create a Pod Identity Association
with the `aws` CLI:

```shell
aws eks create-pod-identity-association \
  --cluster-name ${YOUR_CLUSTER_NAME} \
  --namespace ${YOUR_CONTROL_PLANE_NAMESPACE} \
  --service-account external-secrets-controller \
  --role-arn arn:aws:iam::${YOUR_AWS_ACCOUNT_ID}:role/${YOUR_ROLE_NAME}
```

</CodeBlock>

<CodeBlock cloud="azure">

Upbound supports workload-identity configurations in Azure with Azure's built-in
workload identity feature.

First, enable the OIDC issuer and workload identity in your AKS cluster:

```shell
az aks update --resource-group ${YOUR_RESOURCE_GROUP} --name ${YOUR_AKS_CLUSTER_NAME} --enable-oidc-issuer --enable-workload-identity
```

Next, find and store the OIDC issuer URL as an environment variable:

```shell
export AKS_OIDC_ISSUER="$(az aks show --name ${YOUR_AKS_CLUSTER_NAME} --resource-group ${YOUR_RESOURCE_GROUP} --query "oidcIssuerProfile.issuerUrl" --output tsv)"
```

Create a new managed identity to associate with the shared secrets component:

```shell
az identity create --name secrets-identity --resource-group ${YOUR_RESOURCE_GROUP} --location ${YOUR_LOCATION}
```

Retrieve the client ID and store it as an environment variable:

```shell
export USER_ASSIGNED_CLIENT_ID="$(az identity show --name secrets-identity --resource-group ${YOUR_RESOURCE_GROUP} --query clientId -otsv)"
```

Grant the managed identity you created to access your Azure Storage account:

```shell
az keyvault set-policy --name ${YOUR_KEY_VAULT_NAME} \
  --resource-group ${YOUR_RESOURCE_GROUP} \
  --object-id $(az identity show --name secrets-identity --resource-group ${YOUR_RESOURCE_GROUP} --query principalId -otsv) \
  --secret-permissions get list
```

In your control plane, pass the `--set` flag with the Spaces Helm chart
parameters for the shared secrets component:

```shell
--set controlPlanes.sharedSecrets.serviceAccount.customAnnotations."azure\.workload\.identity/client-id"="${USER_ASSIGNED_CLIENT_ID}"
--set controlPlanes.sharedSecrets.pod.customLabels."azure\.workload\.identity/use"="true"
```

Next, create a federated credential to establish trust between the managed identity
and your AKS OIDC provider:

```shell
az identity federated-credential create \
  --name secrets-federated-identity \
  --identity-name secrets-identity \
  --resource-group ${YOUR_RESOURCE_GROUP} \
  --issuer ${AKS_OIDC_ISSUER} \
  --subject system:serviceaccount:${YOUR_CONTROL_PLANE_NAMESPACE}:external-secrets-controller
```

</CodeBlock>

<CodeBlock cloud="gcp">

Upbound supports workload-identity configurations in GCP with IAM principal
identifiers or service account impersonation.

#### IAM principal identifiers

IAM principal identifiers allow you to grant permissions directly to 
Kubernetes service accounts without additional annotation. Upbound recommends
this approach for ease-of-use and flexibility.

First, enable Workload Identity Federation on your GKE cluster:

```shell
gcloud container clusters update ${YOUR_CLUSTER_NAME} \
    --workload-pool=${YOUR_PROJECT_ID}.svc.id.goog \
    --region=${YOUR_REGION}
```

Next, grant the necessary permissions to your Kubernetes service account:

```shell
gcloud projects add-iam-policy-binding ${YOUR_PROJECT_ID} \
  --member="principalSet://iam.googleapis.com/projects/${YOUR_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${YOUR_PROJECT_ID}.svc.id.goog/attribute.kubernetes_namespace/${YOUR_CONTROL_PLANE_NAMESPACE}/attribute.kubernetes_service_account/external-secrets-controller" \
  --role="roles/secretmanager.secretAccessor"
```

#### Service account impersonation

Service account impersonation allows you to link a Kubernetes service account to
a GCP service account. The Kubernetes service account assumes the permissions of
the GCP service account you specify.

Enable workload id federation on your GKE cluster:

```shell
gcloud container clusters update ${YOUR_CLUSTER_NAME} \
  --workload-pool=${YOUR_PROJECT_ID}.svc.id.goog \
  --region=${YOUR_REGION}
```

Next, create a dedicated service account for your secrets operations:

```shell
gcloud iam service-accounts create secrets-sa \
  --project=${YOUR_PROJECT_ID}
```

Grant secret access permissions to the service account you created:

```shell
gcloud projects add-iam-policy-binding ${YOUR_PROJECT_ID} \
  --member="serviceAccount:secrets-sa@${YOUR_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Link the Kubernetes service account to the GCP service account:

```shell
gcloud iam service-accounts add-iam-policy-binding \
  secrets-sa@${YOUR_PROJECT_ID}.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="serviceAccount:${YOUR_PROJECT_ID}.svc.id.goog[${YOUR_CONTROL_PLANE_NAMESPACE}/external-secrets-controller]"
```

In your control plane, pass the `--set` flag with the Spaces Helm chart
parameters for the shared secrets component:

```shell
--set controlPlanes.sharedSecrets.serviceAccount.customAnnotations."iam\.gke\.io/gcp-service-account"="secrets-sa@${YOUR_PROJECT_ID}.iam.gserviceaccount.com"
```

</CodeBlock>

## Verify your configuration

After you apply the configuration use `kubectl` to verify the service account
has the correct annotation:

```shell
kubectl get serviceaccount external-secrets-controller -n ${YOUR_CONTROL_PLANE_NAMESPACE} -o yaml
```

<CodeBlock cloud="aws">

Verify the `external-secrets` pod is running correctly:

```shell
kubectl get pods -n ${YOUR_CONTROL_PLANE_NAMESPACE} | grep external-secrets
```

</CodeBlock>

<CodeBlock cloud="azure">

Verify the External Secrets Operator pod is running correctly:

```shell
kubectl get pods -n ${YOUR_CONTROL_PLANE_NAMESPACE} | grep external-secrets
```

</CodeBlock>

<CodeBlock cloud="gcp">

Verify the `external-secrets` pod is running correctly:

```shell
kubectl get pods -n ${YOUR_CONTROL_PLANE_NAMESPACE} | grep external-secrets
```

</CodeBlock>

## Restart workload

<CodeBlock cloud="aws">

You must manually restart a workload's pod when you add the
`eks.amazonaws.com/role-arn key` annotation to the running pod's service
account.

This restart enables the EKS pod identity webhook to inject the necessary
environment for using IRSA.

</CodeBlock>

<CodeBlock cloud="azure">

You must manually restart a workload's pod when you add the workload identity annotations to the running pod's service account.

This restart enables the workload identity webhook to inject the necessary
environment for using Azure workload identity.

</CodeBlock>

<CodeBlock cloud="gcp">

GCP workload identity doesn't require pod restarts after configuration changes.
If you do need to restart the workload, use the `kubectl` command to force the
component restart:

</CodeBlock>

```shell
kubectl rollout restart deployment external-secrets
```
<!-- vale gitlab.HeadingContent = NO -->
## Use cases
<!-- vale gitlab.HeadingContent = YES -->

<CodeBlock cloud="aws">

Shared secrets with workload identity eliminates the need for static credentials
in your cluster. These benefits are particularly helpful in:

* Secure application credentials management
* Database connection string storage
* API token management
* Compliance with secret rotation security standards
* Multi-environment configuration with centralized secret management

</CodeBlock>

<CodeBlock cloud="azure">

Using workload identity authentication for shared secrets eliminates the need for static
credentials in your cluster as well as the overhead of credential rotation.
These benefits are particularly helpful in:

* Secure application credentials management
* Database connection string storage
* API token management
* Compliance with secret rotation security standards

</CodeBlock>

<CodeBlock cloud="gcp">

Configuring the external secrets operator with workload identity eliminates the need for
static credentials in your cluster and the overhead of credential rotation.
These benefits are particularly helpful in:

* Secure application credentials management
* Database connection string storage
* API token management
* Compliance with secret rotation security standards

</CodeBlock>

## Next steps

Now that you have workload identity configured for the shared secrets component, visit
the [Shared Secrets][eso-guide] guide for more information.

Other workload identity guides are:
* [Backup and restore][backuprestore]
* [Billing][billing]

[eso-guide]: /self-hosted-spaces/howtos/secrets-management
[backuprestore]: /self-hosted-spaces/howtos/workload-id/backup-restore-config
[billing]: /self-hosted-spaces/howtos/workload-id/billing-config
