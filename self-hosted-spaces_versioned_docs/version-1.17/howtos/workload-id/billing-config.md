---
title: Billing Workload ID
weight: 1
description: Configure workload identity for Spaces Billing
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
cluster for billing in your Space cluster.

</CodeBlock>

<CodeBlock cloud="azure">

Workload-identity authentication lets you use access policies to grant your
self-hosted Space cluster access to your cloud providers. Workload identity
authentication grants temporary Azure credentials to your Kubernetes pod based on
a service account. Assigning managed identities and service accounts allows the pod to
authenticate with Azure resources dynamically and much more securely than static credentials.

This guide walks you through creating a managed identity and federated credential for your AKS
cluster for billing in your Space cluster.

</CodeBlock>

<CodeBlock cloud="gcp">

Workload-identity authentication lets you use access policies to grant your
self-hosted Space cluster access to your cloud providers. Workload identity
authentication grants temporary GCP credentials to your Kubernetes pod based on
a service account. Assigning IAM roles and service accounts allows the pod to
access cloud resources dynamically and much more securely than static
credentials.

This guide walks you through configuring workload identity for your GKE
cluster's billing component.

</CodeBlock>

## Prerequisites

<!-- vale gitlab.FutureTense = NO -->
To set up a workload-identity, you'll need:
<!-- vale gitlab.FutureTense = YES -->

- A self-hosted Space cluster
- Administrator access in your cloud provider
- Helm and `kubectl`

## About the billing component

The `vector.dev` component handles billing metrics collection in spaces. It
stores account data in your cloud storage. By default, this component runs in
each control plane's host namespace.

## Configuration

<CodeBlock cloud="aws">

Upbound supports workload-identity configurations in AWS with IAM Roles for
Service Accounts and EKS pod identity association.

#### IAM Roles for Service Accounts (IRSA)

With IRSA, you can associate a Kubernetes service account in an EKS cluster with
an AWS IAM role. Upbound authenticates workloads with that service account as
the IAM role using temporary credentials instead of static role credentials.
IRSA relies on AWS `AssumeRoleWithWebIdentity` `STS` to exchange OIDC ID tokens with
the IAM role's temporary credentials. IRSA uses the `eks.amazon.aws/role-arn`
annotation to link the service account and the IAM role.

**Create an IAM role and trust policy**

First, create an IAM role appropriate permissions to access your S3 bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::${YOUR_BILLING_BUCKET}",
        "arn:aws:s3:::${YOUR_BILLING_BUCKET}/*"
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
          "<OIDC_PROVIDER>:aud": "sts.amazonaws.com",
          "<OIDC_PROVIDER>:sub": "system:serviceaccount:${YOUR_NAMESPACE}:vector"
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
parameters for the Billing component:

```shell
--set "billing.enabled=true"
--set "billing.storage.provider=aws"
--set "billing.storage.aws.region=${YOUR_AWS_REGION}"
--set "billing.storage.aws.bucket=${YOUR_BILLING_BUCKET}"
--set "billing.storage.secretRef.name="
--set controlPlanes.vector.serviceAccount.customAnnotations."eks\.amazonaws\.com/role-arn"="arn:aws:iam::${YOUR_AWS_ACCOUNT_ID}:role/${YOUR_BILLING_ROLE_NAME}"
```

:::important
You **must** set the `billing.storage.secretRef.name` to an empty string to
enable workload identity for the billing component
:::

#### EKS pod identities

Upbound also supports EKS Pod Identity configuration. EKS Pod Identities allow
you to create a pod identity association with your Kubernetes namespace, a
service account, and an IAM role, which allows the EKS control plane to
automatically handle the credential exchange.

**Create an IAM role**

First, create an IAM role appropriate permissions to access your S3 bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${YOUR_BILLING_BUCKET}",
        "arn:aws:s3:::${YOUR_BILLING_BUCKET}/*"
      ]
    }
  ]
}
```

**Configure your Space with Helm**

When you install or upgrade your Space with Helm, add the billing values:

```shell
helm upgrade spaces spaces-helm-chart \
  --set "billing.enabled=true" \
  --set "billing.storage.provider=aws" \
  --set "billing.storage.aws.region=${YOUR_AWS_REGION}" \
  --set "billing.storage.aws.bucket=${YOUR_BILLING_BUCKET}" \
  --set "billing.storage.secretRef.name="
```

**Create a Pod Identity Association**

After Upbound provisions your control plane, create a Pod Identity Association
with the `aws` CLI:

```shell
aws eks create-pod-identity-association \
  --cluster-name ${YOUR_CLUSTER_NAME} \
  --namespace ${YOUR_CONTROL_PLANE_NAMESPACE} \
  --service-account vector \
  --role-arn arn:aws:iam::${YOUR_AWS_ACCOUNT_ID}:role/${YOUR_BILLING_ROLE_NAME}
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

Create a new managed identity to associate with the billing component:

```shell
az identity create --name billing-identity --resource-group ${YOUR_RESOURCE_GROUP} --location ${YOUR_LOCATION}
```

Retrieve the client ID and store it as an environment variable:

```shell
export USER_ASSIGNED_CLIENT_ID="$(az identity show --name billing-identity --resource-group ${YOUR_RESOURCE_GROUP} --query clientId -otsv)"
```

Grant the managed identity you created to access your Azure Storage account:

```shell
az role assignment create --role "Storage Blob Data Contributor" --assignee $USER_ASSIGNED_CLIENT_ID --scope /subscriptions/${YOUR_SUBSCRIPTION_ID}/resourceGroups/${YOUR_RESOURCE_GROUP}/providers/Microsoft.Storage/storageAccounts/${YOUR_STORAGE_ACCOUNT}
```

In your control plane, pass the `--set` flag with the Spaces Helm chart
parameters for the billing component:

```shell
--set "billing.enabled=true"
--set "billing.storage.provider=azure"
--set "billing.storage.azure.storageAccount=${SPACES_BILLING_STORAGE_ACCOUNT}"
--set "billing.storage.azure.container=${SPACES_BILLING_STORAGE_CONTAINER}"
--set "billing.storage.secretRef.name="
--set controlPlanes.vector.serviceAccount.customAnnotations."azure\.workload\.identity/client-id"="${SPACES_BILLING_APP_ID}"
--set controlPlanes.vector.pod.customLabels."azure\.workload\.identity/use"="true"
```

Create a federated credential to establish trust between the managed identity
and your AKS OIDC provider:

```shell
az identity federated-credential create \
  --name billing-federated-identity \
  --identity-name billing-identity \
  --resource-group ${YOUR_RESOURCE_GROUP} \
  --issuer ${AKS_OIDC_ISSUER} \
  --subject system:serviceaccount:${YOUR_CONTROL_PLANE_NAMESPACE}:vector
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

Next, configure your Spaces installation with the Spaces Helm chart parameters:

```shell
--set "billing.enabled=true"
--set "billing.storage.provider=gcp"
--set "billing.storage.gcp.bucket=${YOUR_BILLING_BUCKET}"
--set "billing.storage.secretRef.name="
```

:::important
You **must** set the `billing.storage.secretRef.name` to an empty string to
enable workload identity for the billing component.
:::

Grant the necessary permissions to your Kubernetes service account:

```shell
gcloud projects add-iam-policy-binding ${YOUR_PROJECT_ID} \
  --member="principalSet://iam.googleapis.com/projects/${YOUR_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${YOUR_PROJECT_ID}.svc.id.goog/attribute.kubernetes_namespace/${YOUR_CONTROL_PLANE_NAMESPACE}/attribute.kubernetes_service_account/vector" \
  --role="roles/storage.objectAdmin"
```

Enable uniform bucket-level access on your storage bucket:

```shell
gcloud storage buckets update gs://${YOUR_BILLING_BUCKET} --uniform-bucket-level-access
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

Next, create a dedicated service account for your billing operations:

```shell
gcloud iam service-accounts create billing-sa \
  --project=${YOUR_PROJECT_ID}
```

Grant storage permissions to the service account you created:

```shell
gcloud projects add-iam-policy-binding ${YOUR_PROJECT_ID} \
  --member="serviceAccount:billing-sa@${YOUR_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

Link the Kubernetes service account to the GCP service account:

```shell
gcloud iam service-accounts add-iam-policy-binding \
  billing-sa@${YOUR_PROJECT_ID}.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="serviceAccount:${YOUR_PROJECT_ID}.svc.id.goog[${YOUR_CONTROL_PLANE_NAMESPACE}/vector]"
```

In your control plane, pass the `--set` flag with the Spaces Helm chart
parameters for the billing component:

```shell
--set "billing.enabled=true"
--set "billing.storage.provider=gcp"
--set "billing.storage.gcp.bucket=${YOUR_BILLING_BUCKET}"
--set "billing.storage.secretRef.name="
--set controlPlanes.vector.serviceAccount.customAnnotations."iam\.gke\.io/gcp-service-account"="billing-sa@${YOUR_PROJECT_ID}.iam.gserviceaccount.com"
```

</CodeBlock>

## Verify your configuration

After you apply the configuration use `kubectl` to verify the service account
has the correct annotation:

```shell
kubectl get serviceaccount vector -n ${YOUR_CONTROL_PLANE_NAMESPACE} -o yaml
```

Verify the `vector` pod is running:

```shell
kubectl get pods -n ${YOUR_CONTROL_PLANE_NAMESPACE} | grep vector
```

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
kubectl rollout restart deployment vector
```

<!-- vale gitlab.HeadingContent = NO -->
## Use cases
<!-- vale gitlab.HeadingContent = YES -->

Using workload identity authentication for billing eliminates the need for static
credentials in your cluster as well as the overhead of credential rotation.
These benefits are helpful in:

* Resource usage tracking across teams/projects
* Cost allocation for multi-tenant environments
* Financial auditing requirements
* Capacity billing and resource optimization
* Automated billing workflows

## Next steps

Now that you have workload identity configured for the billing component, visit
the [Billing guide][billing-guide] for more information.

Other workload identity guides are:
* [Backup and restore][backuprestore] 
* [Shared Secrets][secrets]

[billing-guide]: /self-hosted-spaces/howtos/billing
[backuprestore]: /self-hosted-spaces/howtos/workload-id/backup-restore-config
[secrets]: /self-hosted-spaces/howtos/workload-id/eso-config
