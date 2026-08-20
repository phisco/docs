---
title: Self-Hosted Space Billing
sidebar_position: 50
description: A guide for how billing works in an Upbound Space
---


Spaces are a self-hosting feature of Upbound's [flagship product][flagship-product] for platform teams to deploy control planes in their self-managed environments. You can install Spaces into any Kubernetes cluster in your own cloud account, on-premises data center, or on the edge. The pricing usage-based and requires an Upbound account and subscription. The billing unit is a `Loop`.

<!--vale gitlab.SubstitutionWarning = NO -->
:::info
This guide describes the traditional usage-based billing model using object storage. For disconnected or air-gapped environments, consider [Capacity Licensing](/self-hosted-spaces/howtos/capacity-licensing), which provides a simpler fixed-capacity model with local usage tracking.
:::
<!--vale gitlab.SubstitutionWarning = YES -->
## Billing details

Spaces **aren't connected** to Upbound's global service. To enable proper billing, the Spaces software ships a controller whose responsibility is to collect billing data from your Spaces deployment. The collection and storage of your billing data happens expressly locally within your environment; no data is automatically emitted back to Upbound's global service. This data gets written to object storage of your choice. AWS, Azure, and GCP are currently supported. The Spaces software exports billing usage software every ~15 seconds.

Spaces customers must periodically provide the billing data to Upbound. Contact your Upbound sales representative to learn more.

<!-- vale Google.Headings = NO -->

## AWS S3

<!-- vale Google.Headings = YES -->

Configure billing to write to an S3 bucket by providing the following values at install-time. Create an S3 bucket if you don't already have one.

### IAM policy

You must create an IAM policy and attach it to the IAM user (for static credentials) or IAM role (for assumed
roles).

The policy example below enables the necessary S3 permissions:

```json
{
  "Sid":"EnableS3Permissions",
  "Effect":"Allow",
  "Action": [
      "s3:PutObject",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:DeleteObject"
  ],
  "Resource": [
    "arn:aws:s3:::your-bucket-name/*",
    "arn:aws:s3:::your-bucket-name"
  ]
},
{
  "Sid": "ListBuckets",
  "Effect": "Allow",
  "Action": "s3:ListAllMyBuckets",
  "Resource": "*"
}
```

### Authentication with static credentials

In your Spaces install cluster, create a secret in the `upbound-system`
namespace. This secret must contain keys `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

```bash
kubectl create secret generic billing-credentials -n upbound-system \
  --from-literal=AWS_ACCESS_KEY_ID=<ACCESS_KEY_ID>  \
  --from-literal=AWS_SECRET_ACCESS_KEY=<SECRET_KEY>
```

Install the Space software, providing the billing details to the other required values.


<Tabs>

<TabItem value="Helm" label="Helm">

```bash {hl_lines="2-6"}
helm -n upbound-system upgrade --install spaces ... \
  --set "billing.enabled=true" \
  --set "billing.storage.provider=aws" \
  --set "billing.storage.aws.region=<BUCKET_REGION>" \
  --set "billing.storage.aws.bucket=<BUCKET_NAME>" \
  --set "billing.storage.secretRef.name=billing-credentials"
  ...
```

</TabItem>

<TabItem value="up CLI" label="up CLI">

```bash {hl_lines="2-6"}
up space init ... \
  --set "billing.enabled=true" \
  --set "billing.storage.provider=aws" \
  --set "billing.storage.aws.region=<BUCKET_REGION>" \
  --set "billing.storage.aws.bucket=<BUCKET_NAME>" \
  --set "billing.storage.secretRef.name=billing-credentials"
  ...
```

</TabItem>

</Tabs>

<!-- vale Google.Headings = NO -->

### Authentication with an IAM role

<!-- vale Google.Headings = YES -->
To use short-lived credentials with an assumed IAM role, create an IAM role with
established trust to the `vector`-serviceaccount in all `mxp-*-system`
namespaces.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::12345678912:oidc-provider/oidc.eks.eu-west-2.amazonaws.com/id/YOUROIDCPROVIDERID"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "oidc.eks.eu-west-2.amazonaws.com/id/YOUROIDCPROVIDERID:sub": "system:serviceaccount:mxp-*-system:vector"
        }
      }
    }
  ]
}
```

For more information about workload identities, review the [Workload-identity
Configuration documentation][workload-identity-configuration-documentation]


<Tabs>

<TabItem value="Helm" label="Helm">

```bash {hl_lines="2-7"}
helm -n upbound-system upgrade --install spaces ... \
  --set "billing.enabled=true" \
  --set "billing.storage.provider=aws" \
  --set "billing.storage.aws.region=<BUCKET_REGION>" \
  --set "billing.storage.aws.bucket=<BUCKET_NAME>" \
  --set "billing.storage.secretRef.name=" \
  --set "controlPlanes.vector.serviceAccount.customAnnotations[eks.amazonaws.com/role-arn]=<ROLE_ARN>"
  ...
```

</TabItem>

<TabItem value="up CLI" label="up CLI">

```bash {hl_lines="2-7"}
up space init ... \
  --set "billing.enabled=true" \
  --set "billing.storage.provider=aws" \
  --set "billing.storage.aws.region=<BUCKET_REGION>" \
  --set "billing.storage.aws.bucket=<BUCKET_NAME>" \
  --set "billing.storage.secretRef.name=" \
  --set "controlPlanes.vector.serviceAccount.customAnnotations[eks.amazonaws.com/role-arn]=<ROLE_ARN>"
  ...
```

</TabItem>

</Tabs>

<!-- vale Upbound.Spelling = NO -->
*Note*: You must set `billing.storage.secretRef.name` to an empty string when using an assumed role.
<!-- vale Upbound.Spelling = YES -->

## Azure blob storage

Configure billing to write to a blob in Azure by providing the following values at install-time. Create a storage account and container if you don't already have one.

Then, on the cluster where you installed the Spaces software, create a secret in `upbound-system`. This secret must contain keys `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET`. Make sure to replace the values with details generated from your Azure account.

```bash
kubectl create secret generic billing-credentials -n upbound-system \
  --from-literal=AZURE_TENANT_ID=<TENANT_ID>  \
  --from-literal=AZURE_CLIENT_ID=<CLIENT_ID> \
  --from-literal=AZURE_CLIENT_SECRET=<CLIENT_SECRET>
```

Install the Space software, providing the billing details to the other required values.


<Tabs>

<TabItem value="Helm" label="Helm">

```bash {hl_lines="2-6"}
helm -n upbound-system upgrade --install spaces ... \
  --set "billing.enabled=true" \
  --set "billing.storage.provider=azure" \
  --set "billing.storage.azure.storageAccount=<STORAGE_ACCOUNT>" \
  --set "billing.storage.azure.container=<CONTAINER_NAME>" \
  --set "billing.storage.secretRef.name=billing-credentials"
  ...
```

</TabItem>

<TabItem value="up CLI" label="up CLI">

```bash {hl_lines="2-6"}
up space init ... \
  --set "billing.enabled=true" \
  --set "billing.storage.provider=azure" \
  --set "billing.storage.azure.storageAccount=<STORAGE_ACCOUNT>" \
  --set "billing.storage.azure.container=<CONTAINER_NAME>" \
  --set "billing.storage.secretRef.name=billing-credentials"
  ...
```

</TabItem>

</Tabs>

<!-- vale Google.Headings = NO -->

## GCP Cloud Storage Buckets

<!-- vale Google.Headings = YES -->
Configure billing to write to a Cloud Storage bucket in GCP by providing the following values at install-time. Create a bucket if you don't already have one.

Then, on the cluster where you installed the Spaces software, create a secret in `upbound-system`. This secret must contain the key `google_application_credentials`. Make sure to replace the value with a GCP service account key JSON generated from your GCP account.

```bash
kubectl create secret generic billing-credentials -n upbound-system \
  --from-literal=google_application_credentials=<SERVICE_ACCOUNT_KEY_JSON>
```

Install the Space software, providing the billing details to the other required values.


<Tabs>

<TabItem value="Helm" label="Helm">

```bash {hl_lines="2-5"}
helm -n upbound-system upgrade --install spaces ... \
  --set "billing.enabled=true" \
  --set "billing.storage.provider=gcp" \
  --set "billing.storage.gcp.bucket=<BUCKET_NAME>" \
  --set "billing.storage.secretRef.name=billing-credentials"
  ...
```

</TabItem>

<TabItem value="up CLI" label="up CLI">

```bash {hl_lines="2-5"}
up space init ... \
  --set "billing.enabled=true" \
  --set "billing.storage.provider=gcp" \
  --set "billing.storage.gcp.bucket=<BUCKET_NAME>" \
  --set "billing.storage.secretRef.name=billing-credentials"
  ...
```

</TabItem>

</Tabs>

## Export billing data to send to Upbound

To prepare the billing data to send to Upbound, do the following:

Ensure the current context of your kubeconfig points at the Spaces cluster. Then, run the [export][export] command. 


:::important
Your current CLI must have read access to the bucket to run this command.
:::


The example below exports billing data stored in AWS:

```bash
up space billing export --provider=aws \
  --bucket=spaces-billing-bucket \
  --account=your-upbound-org \
  --billing-month=2024-07 \
  --force-incomplete
```

The command creates a billing report that's zipped up in your current working directory. Send the output to your Upbound sales representative.


You can find full instructions and command options in the up [CLI reference][cli-reference] docs.


[export]: /reference/cli-reference
[cli-reference]: /reference/cli-reference
[flagship-product]: https://www.upbound.io/platform
[workload-identity-configuration-documentation]: https://docs.upbound.io/operate/accounts/authentication/oidc-configuration
