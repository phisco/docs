---
title: Managed Spaces
sidebar_position: 4
description: A guide to Upbound Managed Spaces
plan: business
draft: true
---

<Business />

import GlobalLanguageSelector, { CodeBlock } from '@site/src/components/GlobalLanguageSelector';

<GlobalLanguageSelector />

<!-- vale gitlab.SentenceLength = NO -->
:::important
This feature is only available for select Business Critical customers. You can't
set up your own Managed Space without the assistance of Upbound. If you're
interested in this deployment mode, please [contact us][contact]. 
:::

<CodeBlock cloud="aws">

A Managed Space deployed on AWS is a single-tenant deployment of a control plane
space in your AWS organization in an isolated sub-account. With Managed Spaces,
you can use the same API, CLI, and Console that Upbound offers, with the benefit
of running entirely in a cloud account that you own and Upbound manages for you.

The following guide walks you through setting up a Managed Space in your AWS
organization. If you have any questions while working through this guide,
contact your Upbound Account Representative for help.

</CodeBlock>

<CodeBlock cloud="gcp">

A Managed Space deployed on GCP is a single-tenant deployment of a control plane
space in your GCP organization in an isolated project. With Managed Spaces, you
can use the same API, CLI, and Console that Upbound offers, with the benefit of
running entirely in a cloud account that you own and Upbound manages for you.

The following guide walks you through setting up a Managed Space in your GCP
organization. If you have any questions while working through this guide,
contact your Upbound Account Representative for help.

</CodeBlock>

<!-- vale Google.Headings = NO -->
## Managed Space on your cloud architecture
<CodeBlock cloud="aws">


A Managed Space is a deployment of the Upbound Spaces software inside an
Upbound-controlled sub-account in your AWS cloud environment. The Spaces
software runs in this sub-account, orchestrated by Kubernetes. Backups and
billing data get stored inside bucket or blob storage in the same sub-account.
The control planes deployed and controlled by the Spaces software runs on the
Kubernetes cluster which gets deployed into the sub-account.

The diagram below illustrates the high-level architecture of Upbound Managed Spaces:

![Upbound Managed Spaces arch](/img/managed-arch-aws.png)

The Spaces software gets deployed on an EKS Cluster in the region of your
choice. This EKS cluster is where your control planes are ultimately run.
Upbound also deploys buckets, 1 for the collection of the billing data and 1 for
control plane backups.

Upbound doesn't have access to other sub-accounts nor your organization-level
settings in your cloud environment. Outside of your cloud organization, Upbound
runs the Upbound Console, which includes the Upbound API and web application,
including the dashboard you see at `console.upbound.io`. By default, all
connections are encrypted, but public. Optionally, you also have the option to
use private network connectivity through [AWS PrivateLink][aws-privatelink].

</CodeBlock>

<CodeBlock cloud="gcp">


A Managed Space is a deployment of the Upbound Spaces software inside an
Upbound-controlled project in your GCP cloud environment. The Spaces software
runs in this project, orchestrated by Kubernetes. Backups and billing data get
stored inside bucket or blob storage in the same project. The control planes
deployed and controlled by the Spaces software runs on the Kubernetes cluster
which gets deployed into the project.

The diagram below illustrates the high-level architecture of Upbound Managed Spaces:

![Upbound Managed Spaces arch](/img/managed-arch-gcp.png)

The Spaces software gets deployed on a GKE Cluster in the region of your choice.
This GKE cluster is where your control planes are ultimately run. Upbound also
deploys cloud buckets, 1 for the collection of the billing data and 1 for
control plane backups.

Upbound doesn't have access to other projects nor your organization-level
settings in your cloud environment. Outside of your cloud organization, Upbound
runs the Upbound Console, which includes the Upbound API and web application,
including the dashboard you see at `console.upbound.io`. By default, all
connections are encrypted, but public. Optionally, you also have the option to
use private network connectivity through [GCP Private Service
Connect][gcp-private-service-connect].

</CodeBlock>

## Prerequisites

- An organization created on Upbound

<CodeBlock cloud="aws">

- You should have a preexisting AWS organization to complete this guide. 
- You must create a new AWS sub-account. Read the [AWS documentation][aws-documentation] to learn how to create a new sub-account in an existing organization on AWS.

After the sub-account information gets provided to Upbound, **don't change it
any further.** Any changes made to the sub-account or the resources created by
Upbound for the purposes of the Managed Space deployments voids the SLA you have
with Upbound. If you want to make configuration changes, contact your Upbound
Solutions Architect.

</CodeBlock>

<CodeBlock cloud="gcp">

- You should have a preexisting GCP organization with an active Cloud Billing account to complete this guide. 
- You must create a new GCP project. Read the [GCP documentation][gcp-documentation] to learn how to create a new project in an existing organization on GCP.

After the project information gets provided to Upbound, **don't change it any
further.** Any changes made to the project or the resources created by Upbound
for the purposes of the Managed Space deployments voids the SLA you have with
Upbound. If you want to make configuration changes, contact your Upbound
Solutions Architect.

</CodeBlock>

<CodeBlock cloud="aws">

## Set up cross-account management

Upbound supports using AWS Key Management Service with cross-account IAM
permissions. This enables the isolation of keys so the infrastructure operated
by Upbound has limited access to symmetric keys.

In the KMS key's account, apply the baseline key policy:

```json
{
  "Sid": "Allow Upbound to use this key",
  "Effect": "Allow",
  "Principal": {
    "AWS": ["[Managed Space sub-account ID]"]
  },
  "Action": ["kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:DescribeKey"],
  "Resource": "*"
}
```

You need another key policy to let the sub-account create persistent resources
with the KMS key:

```json
{
  "Sid": "Allow attachment of persistent resources for an Upbound Managed Space",
  "Effect": "Allow",
  "Principal": {
    "AWS": "[Managed Space sub-account ID]"
  },
  "Action": ["kms:CreateGrant", "kms:ListGrants", "kms:RevokeGrant"],
  "Resource": "*",
  "Condition": {
    "Bool": {
      "kms:GrantIsForAWSResource": "true"
    }
  }
}
```

### Configure PrivateLink

By default, all connections to the Upbound Console are encrypted, but public.
AWS PrivateLink is a feature that allows VPC peering whereby your traffic
doesn't traverse the public internet. To have this configured, contact your
Upbound Account Representative.

</CodeBlock>

<CodeBlock cloud="gcp">

## Enable APIs

Enable the following APIs in the new project:

- Kubernetes Engine API
- Cloud Resource Manager API
- Compute Engine API
- Cloud DNS API

:::tip
Read how to enable APIs in a GCP project [here][here].
:::

## Create a service account

Create a service account in the new project. Name the service account,
upbound-sa. Give the service account the following roles:

- Compute Admin
- Project IAM Admin
- Service Account Admin
- DNS Administrator
- Editor

Select the service account you just created. Select keys. Add a new key and
select JSON. The key gets downloaded to your machine. Save this for later. 

## Create a DNS Zone

Create a DNS Zone, set the **Zone type** to `Public`.

### Configure Private Service Connect

By default, all connections to the Upbound Console are encrypted, but public.
GCP Private Service Connect is a feature that allows VPC peering whereby your
traffic doesn't traverse the public internet. To have this configured, contact
your Upbound Account Representative.

</CodeBlock>

## Provide information to Upbound

Once these policies get attached to the key, tell your Upbound Account
Representative, providing them the following:

<CodeBlock cloud="aws">

- the full ARN of the KMS key. 
- the name of the organization that you created in Upbound. Use the up CLI command, `up org list`, so see this information.
- Confirmation of which region in AWS you want the deployment to target.

</CodeBlock>

<CodeBlock cloud="gcp">

- The service account JSON key
- The NS records associated with the DNS name created in the last step.
- the name of the organization that you created in Upbound. Use the up CLI command, `up org list`, so see this information.
- Confirmation of which region in GCP you want the deployment to target.

</CodeBlock>

Once Upbound has this information, the request gets processed in a business day. 

## Use your Managed Space

Once the Managed Space gets deployed, you can see it in the Space selector when browsing your environment on [`console.upbound.io`][console-upbound-io].

<!-- vale gitlab.SentenceLength = YES -->
<!-- vale Google.Headings = YES -->

[contact]: https://www.upbound.io/contact-us
[aws-privatelink]: #configure-privatelink
[aws-documentation]: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_accounts_create.html#orgs_manage_accounts_create-new
[gcp-private-service-connect]: #configure-private-service-connect
[gcp-documentation]: https://cloud.google.com/resource-manager/docs/creating-managing-organization
[here]: https://cloud.google.com/apis/docs/getting-started#enabling_apis
[console-upbound-io]: https://console.upbound.io/
