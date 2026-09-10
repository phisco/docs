---
title: Space Backups Workload ID
weight: 1
description: Configure workload identity for Space Backups
---
import GlobalLanguageSelector, { CodeBlock } from '@site/src/components/GlobalLanguageSelector';

<GlobalLanguageSelector />

<Business />

<CodeBlock cloud="aws">

Workload-identity authentication lets you use access policies to grant temporary
AWS credentials to your Kubernetes pod with a service account. Assigning IAM
roles and service accounts allows the pod to assume the IAM role dynamically and
much more securely than static credentials.

This guide walks you through granting the Space Backups component access to your
S3 bucket with an IAM role instead of a storage credential Secret.

</CodeBlock>

<CodeBlock cloud="azure">

Workload-identity authentication grants temporary Azure credentials to your
Kubernetes pod based on a service account. Assigning managed identities and
service accounts allows the pod to authenticate with Azure resources
dynamically and much more securely than static credentials.

This guide walks you through granting the Space Backups component access to your
Azure Storage account with a managed identity instead of a storage account key.

</CodeBlock>

<CodeBlock cloud="gcp">

Workload-identity authentication grants temporary GCP credentials to your
Kubernetes pod based on a service account. Assigning IAM roles and service
accounts allows the pod to access cloud resources dynamically and much more
securely than static credentials.

This guide walks you through granting the Space Backups component access to your
Cloud Storage bucket with a Google service account instead of a service account
key.

</CodeBlock>

## Prerequisites

<!-- vale gitlab.FutureTense = NO -->
To set up a workload identity for Space Backups, you'll need:
<!-- vale gitlab.FutureTense = YES -->

- A self-hosted Space cluster with the Space Backups feature enabled
- Administrator access in your cloud provider
- Helm and `kubectl`

<CodeBlock cloud="azure">

:::important
Setting a pod label on the Space Backups component requires the
`controller.podLabels` Helm parameter, available in Spaces `v1.19.0` and later.
:::

</CodeBlock>

<!-- vale Google.Headings = NO -->
## About the Space Backups component
<!-- vale Google.Headings = YES -->

The `spaces-controller` component handles Space Backups. It runs in the
`upbound-system` namespace, uses the `spaces-controller` service account, and
reads the storage details from a [SpaceBackupConfig][dr-guide].

This component is separate from the `mxp-controller` component that handles
per-control-plane backups. Configuring one doesn't configure the other. For
per-control-plane backups, see [Backup and Restore Workload
ID][backup-restore-config].

## Configuration

<CodeBlock cloud="aws">

Upbound supports workload-identity configurations in AWS with IAM Roles for
Service Accounts and EKS pod identity association.

#### IAM Roles for Service Accounts (IRSA)

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

Configure the IAM role trust policy with the `spaces-controller` service
account in the `upbound-system` namespace:

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
          "${YOUR_OIDC_PROVIDER}:sub": "system:serviceaccount:upbound-system:spaces-controller"
        }
      }
    }
  ]
}
```

Pass the `--set` flag with the Spaces Helm chart parameter for the Space
Backups component:

```shell
--set controller.serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="${SPACES_BACKUP_IAM_ROLE_ARN}"
```

#### EKS pod identities

Upbound also supports EKS Pod Identity configuration. Create the pod identity
association against the `spaces-controller` service account instead of
annotating it:

```shell
aws eks create-pod-identity-association \
  --cluster-name ${YOUR_CLUSTER_NAME} \
  --namespace upbound-system \
  --service-account spaces-controller \
  --role-arn ${SPACES_BACKUP_IAM_ROLE_ARN}
```

</CodeBlock>

<CodeBlock cloud="azure">

Upbound supports workload-identity configurations in Azure with Azure's
built-in workload identity feature.

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

Create a new managed identity to associate with the Space Backups component:

```shell
az identity create --name space-backup-identity --resource-group ${YOUR_RESOURCE_GROUP} --location ${YOUR_LOCATION}
```

Retrieve the client ID and store it as an environment variable:

```shell
export USER_ASSIGNED_CLIENT_ID="$(az identity show --name space-backup-identity --resource-group ${YOUR_RESOURCE_GROUP} --query clientId -otsv)"
```

Grant the managed identity you created access to your Azure Storage account:

```shell
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee ${USER_ASSIGNED_CLIENT_ID} \
  --scope /subscriptions/${YOUR_SUBSCRIPTION_ID}/resourceGroups/${YOUR_RESOURCE_GROUP}/providers/Microsoft.Storage/storageAccounts/${YOUR_STORAGE_ACCOUNT}
```

#### Create a Federated Identity credential

Bind the managed identity to the `spaces-controller` service account in the
`upbound-system` namespace:

```shell
az identity federated-credential create \
  --name space-backup-federated-identity \
  --identity-name space-backup-identity \
  --resource-group ${YOUR_RESOURCE_GROUP} \
  --issuer ${AKS_OIDC_ISSUER} \
  --subject system:serviceaccount:upbound-system:spaces-controller
```

#### Apply the managed identity role

The Azure workload identity webhook injects the projected token and the
`AZURE_*` environment into a pod only when the **pod** carries the
`azure.workload.identity/use` label. Annotating the service account alone isn't
enough. Pass both Spaces Helm chart parameters:

```shell
--set-string controller.serviceAccount.annotations."azure\.workload\.identity/client-id"="${USER_ASSIGNED_CLIENT_ID}"
--set-string controller.podLabels."azure\.workload\.identity/use"="true"
```

:::tip
Use `--set-string` for the label. A bare `--set` passes `true` as a boolean,
which the chart's values schema rejects.
:::

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

Create a service account for the Space Backups component:

```shell
gcloud iam service-accounts create space-backup-sa \
  --display-name "Space Backup Service Account" \
  --project ${YOUR_PROJECT_ID}
```

Grant the service account access to your Cloud Storage bucket:

```shell
gcloud projects add-iam-policy-binding ${YOUR_PROJECT_ID} \
  --member "serviceAccount:space-backup-sa@${YOUR_PROJECT_ID}.iam.gserviceaccount.com" \
  --role "roles/storage.objectAdmin"
```

#### Configure Workload Identity

Create an IAM binding to grant the `spaces-controller` service account access
to the Google service account:

```shell
gcloud iam service-accounts add-iam-policy-binding \
  space-backup-sa@${YOUR_PROJECT_ID}.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:${YOUR_PROJECT_ID}.svc.id.goog[upbound-system/spaces-controller]"
```

#### Apply the service account configuration

Pass the `--set` flag with the Spaces Helm chart parameter for the Space
Backups component:

```shell
--set controller.serviceAccount.annotations."iam\.gke\.io/gcp-service-account"="space-backup-sa@${YOUR_PROJECT_ID}.iam.gserviceaccount.com"
```

</CodeBlock>

<!-- vale Google.Headings = NO -->
## Configure the SpaceBackupConfig
<!-- vale Google.Headings = YES -->

A [SpaceBackupConfig][dr-guide] with `spec.objectStorage.credentials.source` set
to `InjectedIdentity` tells Space Backups to authenticate with the identity of
the `spaces-controller` pod rather than a Secret.

<CodeBlock cloud="aws">

```yaml
apiVersion: admin.spaces.upbound.io/v1alpha1
kind: SpaceBackupConfig
metadata:
  name: default
spec:
  objectStorage:
    provider: AWS
    bucket: spaces-backup-bucket
    config:
      endpoint: s3.eu-west-2.amazonaws.com
      region: eu-west-2
    credentials:
      source: InjectedIdentity
```

</CodeBlock>

<CodeBlock cloud="azure">

```yaml
apiVersion: admin.spaces.upbound.io/v1alpha1
kind: SpaceBackupConfig
metadata:
  name: default
spec:
  objectStorage:
    provider: Azure
    bucket: upbound-backups
    config:
      storage_account: upbackupstore
      endpoint: blob.core.windows.net
    credentials:
      source: InjectedIdentity
```

:::warning
Don't set `user_assigned_id` in `spec.objectStorage.config`. That field selects
the managed identity assigned to the node, which grants every pod on that node
the same access. Leaving it unset is what allows the client to pick up the
federated token of the `spaces-controller` pod. Spaces rejects the deprecated
`msi_resource` field.
:::

</CodeBlock>

<CodeBlock cloud="gcp">

```yaml
apiVersion: admin.spaces.upbound.io/v1alpha1
kind: SpaceBackupConfig
metadata:
  name: default
spec:
  objectStorage:
    provider: GCP
    bucket: spaces-backup-bucket
    credentials:
      source: InjectedIdentity
```

</CodeBlock>

## Restart workload

You must manually restart the `spaces-controller` pod when you add the workload
identity configuration to a running deployment.

<CodeBlock cloud="aws">

This restart enables the EKS pod identity webhook to inject the necessary
environment for using IRSA.

</CodeBlock>

<CodeBlock cloud="azure">

This restart enables the workload identity webhook to inject the necessary
environment for using Azure workload identity.

</CodeBlock>

<CodeBlock cloud="gcp">

This restart enables the pod to pick up the Workload Identity Federation
configuration.

</CodeBlock>

```shell
kubectl rollout restart deployment spaces-controller -n upbound-system
```

## Verify your configuration

Verify the service account carries the annotation you set:

```shell
kubectl get serviceaccount spaces-controller -n upbound-system -o yaml
```

<CodeBlock cloud="azure">

Verify the pod carries the label and that the webhook injected the federated
token:

```shell
kubectl get pods -n upbound-system -l app=spaces-controller \
  -o jsonpath='{.items[*].metadata.labels}'
kubectl get pods -n upbound-system -l app=spaces-controller \
  -o jsonpath='{.items[*].spec.containers[*].env[?(@.name=="AZURE_FEDERATED_TOKEN_FILE")]}'
```

An empty second result means the webhook didn't process the pod. Check that the
label value is the string `"true"` and that workload identity is enabled on the
cluster.

</CodeBlock>

Then create a backup and confirm it completes:

```shell
kubectl apply -f - <<EOF
apiVersion: admin.spaces.upbound.io/v1alpha1
kind: SpaceBackup
metadata:
  name: workload-id-check
spec:
  configRef:
    kind: SpaceBackupConfig
    name: default
EOF
kubectl get spacebackup workload-id-check -w
```

<!-- vale Google.Headings = NO -->
## Restoring a Space
<!-- vale Google.Headings = YES -->

The `spacebackup-restore` command runs outside the `spaces-controller`
deployment, so it doesn't inherit the pod identity you configured here. Run it
in an environment that can authenticate to your object storage, or pass it a
SpaceBackupConfig that references a Secret. See [Disaster Recovery][dr-guide]
for the restore procedure.

## Next steps

Now that you have a workload identity configured for Space Backups, visit the
[Disaster Recovery][dr-guide] documentation to configure backup schedules.

Other workload identity guides are:
* [Backup and Restore][backup-restore-config]
* [Billing][billing]
* [Shared Secrets][secrets]

[dr-guide]: ../dr.md
[backup-restore-config]: ./backup-restore-config.md
[billing]: ./billing-config.md
[secrets]: ./eso-config.md
