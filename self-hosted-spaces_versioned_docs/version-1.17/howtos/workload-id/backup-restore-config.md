---
title: Backup and Restore Workload ID
weight: 1
description: Configure workload identity for Spaces Backup and Restore
---
import GlobalLanguageSelector, { CodeBlock } from '@site/src/components/GlobalLanguageSelector';

<GlobalLanguageSelector />

<Business />

<CodeBlock cloud="aws">

Workload-identity authentication lets you use access policies to grant temporary
AWS credentials to your Kubernetes pod with a service account. Assigning IAM roles and service accounts allows the pod to assume the IAM role dynamically and much more securely than static credentials.

This guide walks you through creating an IAM trust role policy and applying it
to your EKS cluster to handle backup and restore storage.

</CodeBlock>

<CodeBlock cloud="azure">

Workload-identity authentication lets you use access policies to grant your
self-hosted Space cluster access to your cloud providers. Workload identity
authentication grants temporary Azure credentials to your Kubernetes pod based on
a service account. Assigning managed identities and service accounts allows the pod to
authenticate with Azure resources dynamically and much more securely than static credentials.

This guide walks you through creating a managed identity and federated credential for your AKS
cluster to handle backup and restore storage.

</CodeBlock>

<CodeBlock cloud="gcp">

Workload-identity authentication lets you use access policies to grant your
self-hosted Space cluster access to your cloud providers. Workload identity
authentication grants temporary GCP credentials to your Kubernetes pod based on
a service account. Assigning IAM roles and service accounts allows the pod to
access cloud resources dynamically and much more securely than static credentials.

This guide walks you through configuring workload identity for your GKE
cluster to handle backup and restore storage.

</CodeBlock>

## Prerequisites

<!-- vale gitlab.FutureTense = NO -->
To set up a workload-identity, you'll need:
<!-- vale gitlab.FutureTense = YES -->

- A self-hosted Space cluster
- Administrator access in your cloud provider
- Helm and `kubectl`

## About the backup and restore component

The `mxp-controller` component handles backup and restore workloads. It needs to
access your cloud storage to store and retrieve backups. By default, this
component runs in each control plane's host namespace. 

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

First, create an IAM role with appropriate permissions to access your S3 bucket:

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
        "arn:aws:s3:::${YOUR_BACKUP_BUCKET}",
        "arn:aws:s3:::${YOUR_BACKUP_BUCKET}/*"
      ]
    }
  ]
}
```

Next, ensure your EKS cluster has an OIDC identity provider:

```shell
eksctl utils associate-iam-oidc-provider --cluster ${YOUR_CLUSTER_NAME} --approve
```

Configure the IAM role trust policy with the namespace for each
provisioned control plane.

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
          "${YOUR_OIDC_PROVIDER}:aud": "sts.amazonaws.com",
          "${YOUR_OIDC_PROVIDER}:sub": "system:serviceaccount:${YOUR_NAMESPACE}:mxp-controller"
        }
      }
    }
  ]
}
```

In your control plane, pass the `--set` flag with the Spaces Helm chart
parameters for the Backup and Restore component:

```shell
--set controlPlanes.mxpController.serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="${SPACES_BR_IAM_ROLE_ARN}"
```

This command allows the backup and restore component to authenticate with your
dedicated IAM role in your EKS cluster environment.

#### EKS pod identities

Upbound also supports EKS Pod Identity configuration. EKS Pod Identities allow
you to create a pod identity association with your Kubernetes namespace, a
service account, and an IAM role, which allows the EKS control plane to
automatically handle the credential exchange.

First, create an IAM role with appropriate permissions to access your S3 bucket:

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
        "arn:aws:s3:::${YOUR_BACKUP_BUCKET}",
        "arn:aws:s3:::${YOUR_BACKUP_BUCKET}/*"
      ]
    }
  ]
}
```

When you install or upgrade your Space with Helm, add the backup/restore values:

```shell
helm upgrade spaces spaces-helm-chart \
  --set "billing.enabled=true" \
  --set "backup.enabled=true" \
  --set "backup.storage.provider=aws" \
  --set "backup.storage.aws.region= ${YOUR_AWS_REGION}" \
  --set "backup.storage.aws.bucket= ${YOUR_BACKUP_BUCKET}"
```

After Upbound provisions your control plane, create a Pod Identity Association
with the `aws` CLI:

```shell
aws eks create-pod-identity-association \
  --cluster-name ${YOUR_CLUSTER_NAME} \
  --namespace ${YOUR_CONTROL_PLANE_NAMESPACE} \
  --service-account mxp-controller \
  --role-arn arn:aws:iam::${YOUR_AWS_ACCOUNT_ID}:role/backup-restore-role
```

</CodeBlock>

<CodeBlock cloud="azure">

Upbound supports workload-identity configurations in Azure with Azure's built-in
workload identity feature.

#### Prepare your cluster

First, enable the OIDC issuer and workload identity in your AKS cluster:

```shell
az aks update --resource-group ${YOUR_RESOURCE_GROUP} --name ${YOUR_AKS_CLUSTER_NAME} --enable-oidc-issuer --enable-workload-identity
```

Next, find and store the OIDC issuer URL as an environment variable:

```shell
export AKS_OIDC_ISSUER="$(az aks show --name ${YOUR_AKS_CLUSTER_NAME} --resource-group ${YOUR_RESOURCE_GROUP} --query "oidcIssuerProfile.issuerUrl" --output tsv)"
```

#### Create a User-Assigned Managed Identity

Create a new managed identity to associate with the backup and restore component:

```shell
az identity create --name backup-restore-identity --resource-group ${YOUR_RESOURCE_GROUP} --location ${YOUR_LOCATION}
```

Retrieve the client ID and store it as an environment variable:

```shell
export USER_ASSIGNED_CLIENT_ID="$(az identity show --name backup-restore-identity --resource-group ${YOUR_RESOURCE_GROUP} --query clientId -otsv)"
```

Grant the managed identity you created to access your Azure Storage account:

```shell
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee ${USER_ASSIGNED_CLIENT_ID} \
  --scope /subscriptions/${YOUR_SUBSCRIPTION_ID}/resourceGroups/${YOUR_RESOURCE_GROUP}/providers/Microsoft.Storage/storageAccounts/${YOUR_STORAGE_ACCOUNT}
```

#### Apply the managed identity role

In your control plane, pass the `--set` flag with the Spaces Helm chart
parameters for the backup and restore component:

```shell
--set controlPlanes.mxpController.serviceAccount.annotations."azure\.workload\.identity/client-id"="${YOUR_USER_ASSIGNED_CLIENT_ID}"
--set controlPlanes.mxpController.pod.customLabels."azure\.workload\.identity/use"="true"
```

#### Create a Federated Identity credential

```shell
az identity federated-credential create \
  --name backup-restore-federated-identity \
  --identity-name backup-restore-identity \
  --resource-group ${YOUR_RESOURCE_GROUP} \
  --issuer ${AKS_OIDC_ISSUER} \
  --subject system:serviceaccount:${YOUR_CONTROL_PLANE_NAMESPACE}:mxp-controller
```

</CodeBlock>

<CodeBlock cloud="gcp">

Upbound supports workload-identity configurations in GCP with IAM principal
identifiers and service account impersonation.

#### Prepare your cluster

First, enable Workload Identity Federation on your GKE cluster:

```shell
gcloud container clusters update ${YOUR_CLUSTER_NAME} \
    --workload-pool=${YOUR_PROJECT_ID}.svc.id.goog \
    --region=${YOUR_REGION}
```

#### Create a Google Service Account

Create a service account for the backup and restore component:

```shell
gcloud iam service-accounts create backup-restore-sa \
  --display-name "Backup Restore Service Account" \
  --project ${YOUR_PROJECT_ID}
```

Grant the service account access to your Google Cloud Storage bucket:

```shell
gcloud projects add-iam-policy-binding ${YOUR_PROJECT_ID} \
  --member "serviceAccount:backup-restore-sa@${YOUR_PROJECT_ID}.iam.gserviceaccount.com" \
  --role "roles/storage.objectAdmin"
```

#### Configure Workload Identity

Create an IAM binding to grant the Kubernetes service account access to the Google service account:

```shell
gcloud iam service-accounts add-iam-policy-binding \
  backup-restore-sa@${YOUR_PROJECT_ID}.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:${YOUR_PROJECT_ID}.svc.id.goog[${YOUR_CONTROL_PLANE_NAMESPACE}/mxp-controller]"
```

#### Apply the service account configuration

In your control plane, pass the `--set` flag with the Spaces Helm chart
parameters for the backup and restore component:

```shell
--set controlPlanes.mxpController.serviceAccount.annotations."iam\.gke\.io/gcp-service-account"="backup-restore-sa@${YOUR_PROJECT_ID}.iam.gserviceaccount.com"
```

</CodeBlock>

## Verify your configuration

After you apply the configuration use `kubectl` to verify the service account
has the correct annotation:

```shell
kubectl get serviceaccount mxp-controller -n ${YOUR_CONTROL_PLANE_NAMESPACE} -o yaml
```

Verify the `mxp-controller` pod is running:

```shell
kubectl get pods -n ${YOUR_CONTROL_PLANE_NAMESPACE} | grep mxp-controller
```

## Restart workload

You must manually restart a workload's pod when you add the workload identity annotations to the running pod's service account.

<CodeBlock cloud="aws">

This restart enables the EKS pod identity webhook to inject the necessary
environment for using IRSA.

</CodeBlock>

<CodeBlock cloud="azure">

This restart enables the workload identity webhook to inject the necessary
environment for using Azure workload identity.

</CodeBlock>

<CodeBlock cloud="gcp">

This restart enables the workload identity webhook to inject the necessary
environment for using GCP workload identity.

</CodeBlock>

```shell
kubectl rollout restart deployment mxp-controller -n ${YOUR_CONTROL_PLANE_NAMESPACE}
```
<!-- vale gitlab.HeadingContent = NO -->
## Use cases
<!-- vale gitlab.HeadingContent = YES -->

Configuring backup and restore with workload identity eliminates the need for
static credentials in your cluster and the overhead of credential rotation.
These benefits are helpful in:

* Disaster recovery scenarios
* Control plane migration
* Compliance requirements
* Rollbacks after unsuccessful upgrades

## Next steps

Now that you have a workload identity configured for the backup and restore
component, visit the [Backup Configuration][backup-restore-guide] documentation.

Other workload identity guides are:
* [Billing][billing]
* [Shared Secrets][secrets]

[backup-restore-guide]: /self-hosted-spaces/howtos/backup-and-restore
[billing]: /self-hosted-spaces/howtos/workload-id/billing-config
[secrets]: /self-hosted-spaces/howtos/workload-id/eso-config
