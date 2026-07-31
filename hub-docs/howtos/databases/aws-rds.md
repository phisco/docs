---
title: AWS RDS
sidebar_position: 2
description: Provision Amazon RDS for PostgreSQL and connect Hub with IAM auth.
---

Provision Amazon RDS for PostgreSQL, grant Hub a database role that
authenticates with AWS IAM, then record the resulting endpoint and region for
the install.

IAM authentication is the recommended path for self-hosted Hub on AWS. Rather
than storing a static database password in your cluster, the `hub-core` Pods
exchange a short-lived RDS auth token per database connection, using credentials
from IAM Roles for Service Accounts (IRSA) or EKS Pod Identity.

If you can't use IAM in your environment, review the [password-auth
fallback](#password-authentication-fallback) instructions.

## Prerequisites
<!-- vale write-good.Passive = NO -->
Before you begin, have the following ready:

- An AWS account with permissions to create RDS instances, IAM roles, IAM
  policies, and (if you don't already have one) an OIDC provider for your EKS
  cluster.
- A Kubernetes cluster running on AWS with a working AWS workload-identity
  mechanism: either [IAM Roles for Service
  Accounts][iam-roles-for-service-accounts]
  on EKS or [EKS Pod
  Identity][eks-pod-identity].
  Self-managed clusters can use IRSA as long as the API server's
  service-account-issuer is registered as an IAM OIDC provider.
- `psql` (or another PostgreSQL client) installed locally, reachable to the RDS
  instance for the one-time bootstrap. A bastion or VPN is fine.
<!-- vale write-good.Passive = YES -->

:::note
This page assumes you have already read [the self-hosted
overview][architecture] and [the database overview][overview]. It does
not repeat generic Postgres requirements covered there.
:::

<!-- vale Microsoft.HeadingAcronyms = NO -->
<!-- vale Google.Headings = NO -->
## Provision RDS
<!-- vale Google.Headings = YES -->
<!-- vale Microsoft.HeadingAcronyms = YES -->

Provision the database with whichever IaC tool you already use. This section
lists only the settings that matter for Hub.

Read these AWS guides end-to-end before provisioning:

- [Creating a PostgreSQL DB instance][creating-a-postgresql-db-instance]
- [IAM database authentication for MariaDB, MySQL, and PostgreSQL][iam-database-authentication-for-mariadb-mysql-and-postgresql]
- [VPC security groups for RDS][vpc-security-groups-for-rds]

When you create the instance, set the following:

- **Engine**: PostgreSQL 18 or newer.
- **IAM database authentication**: enabled. This setting works as a per-instance
  flag. You must enable it at the instance level before you can use it for any
  single database or role.
 - **Network**: place the instance in private subnets
  and attach a security group that allows inbound TCP 5432 from the security group attached to the worker
  nodes that run `hub-core`.
- **TLS**: RDS terminates TLS by default. Note the CA bundle you need to
  trust, since RDS rotates these on a published schedule.

Record three values once the instance is available:

- the RDS endpoint hostname (for example,`hub.cluster-xxxx.us-east-1.rds.amazonaws.com`).
- the instance's **DbiResourceId** (a string starting with `db-…`). You can find
  it in the RDS console under the instance's **Configuration** tab, or via `aws
  rds describe-db-instances`. An IAM policy you create later targets this ID,
  not the instance name.
- the AWS region (for example, `us-east-1`).

:::warning
Enabling IAM database authentication on an existing instance triggers a reboot,
so schedule it during a maintenance window.
:::

## Configure IAM authentication

IAM auth for RDS has three sides that must agree:

1. An IAM role the `hub-core` Pod can assume.
2. A policy on that role granting `rds-db:connect` for the database user Hub
   logs in as.
3. A PostgreSQL role with the same name as the IAM user, granted the `rds_iam` role inside the database.

### Create the database role

Connect to the instance as the master user and create the role Hub uses. This
role needs the `rds_iam` grant so RDS accepts IAM-issued tokens for it, as
described in [Creating a database account using IAM
authentication][iam-db-accounts]. It also needs ownership of the Hub database so
migrations can create and alter objects.

```sql
CREATE DATABASE hub;
CREATE USER hub;
GRANT rds_iam TO hub;
GRANT ALL PRIVILEGES ON DATABASE hub TO hub;
\c hub
GRANT ALL ON SCHEMA public TO hub;
```

Hub's migrations create the `hstore` extension on first run, which requires
database-owner or superuser privileges. You can either grant ownership of the
database to `hub`:

```sql
ALTER DATABASE hub OWNER TO hub;
```

or pre-create the extension as the master user and skip the ownership grant:

```sql
\c hub
CREATE EXTENSION IF NOT EXISTS hstore;
```

:::note
`rds_iam` and password authentication are mutually exclusive on RDS. A role
granted `rds_iam` can't also log in with a password. Don't set a password on
`hub`.
:::

### Create the IAM policy

Follow [Creating and using an IAM policy for IAM database
access][iam-policy-for-db-access]. Hub needs one statement, allowing
`rds-db:connect` on the `hub` database role:

| Field | Value for Hub |
| --- | --- |
| Action | `rds-db:connect` |
| Resource | `arn:aws:rds-db:<region>:<account-id>:dbuser:<dbi-resource-id>/hub` |

The final segment of the resource ARN is the database role name, `hub`, and
`<dbi-resource-id>` is the `db-…` string you recorded above, not the instance
name.

Record the resulting policy ARN. You attach it to the role in the next section.

### Bind the policy to the hub-core ServiceAccount

Attach the policy to an IAM role the `hub-core` Pod can assume. AWS offers two
mechanisms. IRSA works on any EKS cluster with an IAM OIDC provider. Pod Identity
is simpler to manage where it's available.

Whichever you pick, the role identifies the Pod by its Kubernetes
ServiceAccount. The chart creates that ServiceAccount, so these values are what
AWS's procedure needs:

| What the AWS procedure asks for | Value for Hub |
| --- | --- |
| Namespace | `hub`, or the namespace you install the release into |
| ServiceAccount name | `hub-core` |
| IRSA trust policy `sub` condition | `system:serviceaccount:hub:hub-core` |
| IRSA trust policy `aud` condition | `sts.amazonaws.com` |

<!-- vale Microsoft.HeadingAcronyms = NO -->
#### Option A: IAM roles for service accounts (IRSA)
<!-- vale Microsoft.HeadingAcronyms = YES -->

Follow [Assign IAM roles to Kubernetes service accounts][associate-sa-role],
using the subject and audience conditions from the table above. If your
cluster's OIDC issuer isn't registered with IAM yet, do [Create an IAM OIDC
provider][create-an-iam-oidc-provider] first.

You then annotate the ServiceAccount with the role ARN through Helm values,
shown in the next section.

#### Option B: EKS pod identity

Follow [Assign an IAM role to a Kubernetes service
account][pod-id-association], creating the association against namespace `hub`
and ServiceAccount `hub-core`. Create the association after you install Hub, so
the ServiceAccount exists.

<!-- vale write-good.Passive = NO -->
With Pod Identity the ServiceAccount needs no annotations. EKS keys the
association by namespace and ServiceAccount name, so leave the
`eks.amazonaws.com/role-arn` annotation out of your Helm values.

## Values to record

The IAM-auth values omit any password Secret. `hub-core` reads the auth mode
and cloud from environment variables emitted by the chart. It then builds an RDS
auth token from the Pod's IAM credentials. It uses that token as the PostgreSQL
password on every new pool connection. TLS is required: the chart forces
`sslmode=require` whenever IAM mode is selected, even if you leave
`postgresql.sslmode` unset.
<!-- vale write-good.Passive = YES -->

Record these values and enter them in the **AWS IAM authentication** tab in step
4 of [the install guide][install]:

| Value | Where it came from |
| --- | --- |
| RDS endpoint hostname | The provisioned instance |
| AWS region | The provisioned instance |
| Database name and user | `hub` and `hub`, from the SQL above |
| IAM role ARN | The role you attached the policy to. IRSA only |

The completed block should look like this:

```yaml
hub-core:
  api:
    serviceAccount:
      create: true
      # Only needed for IRSA. Pod Identity does not use ServiceAccount annotations.
      annotations:
        eks.amazonaws.com/role-arn: arn:aws:iam::<account-id>:role/hub-core

  postgresql:
    host: <rds-endpoint>
    port: 5432
    database: hub
    user: hub
    sslmode: require

    auth:
      mode: iam
      cloud: aws
      aws:
        region: <region>
```

:::note
The chart ignores its `postgresql.connectionString` value when `auth.mode=iam`.
Use the discrete `host`, `port`, `database`, and `user` fields.
:::

## Troubleshoot IAM auth

Once you've installed Hub, watch the `hub-core` Pods roll out:

```bash
kubectl -n hub rollout status deployment/hub-core
```

The Pod runs the schema migrator as an init container before the API server
starts. Both use the same IAM auth path, so a successful rollout means both the
migrator and the server authenticated against RDS.

If the Pod is crash-looping, check its logs for one of these:
<!-- vale write-good.Passive = NO -->
- `IAM database auth requires TLS`. `postgresql.sslmode` was set to `disable`.
  Remove the override or set it to `require`.
- `database auth aws region is required`. `postgresql.auth.aws.region` is empty
  and the Pod has no `AWS_REGION` environment variable. Set the value in
  `values.yaml`.
- `PAM authentication failed` (in the RDS log). The IAM role is missing
  `rds-db:connect` for the resource, the DbiResourceId in the policy is wrong,
  or the database role wasn't granted `rds_iam`.

Log in to Hub and confirm at least one ControlPlane has been registered
or can be created. Schema is in place when the UI lists resources without
errors.
<!-- vale write-good.Passive = YES -->

## Password authentication (fallback)

Use this section only if you can't use IAM authentication, such as when running
outside AWS or on a Kubernetes cluster without workload identity. Password mode
stores a long-lived credential in a Secret. Rotate it through whatever
secret-management tool your organization already uses.

Create the database role with a password rather than the `rds_iam`
grant:

```sql
CREATE USER hub WITH PASSWORD '<your-password>';
GRANT ALL PRIVILEGES ON DATABASE hub TO hub;
```

Then use the **Password authentication** tab in step 4 of [the install
guide][install] instead of the IAM tab, with the RDS endpoint as the host. Step
2 of that guide creates the Secret holding the password you set above. Skip the
IAM role, policy, and ServiceAccount setup on this page entirely.

Everything else (TLS, security groups, schema bootstrap) works the same as the
IAM path.

## Next step

Return to [the self-hosted install guide][install] to finish wiring Hub
against the database you just provisioned.

[architecture]: /hub/concepts/architecture
[create-an-iam-oidc-provider]: https://docs.aws.amazon.com/eks/latest/userguide/enable-iam-roles-for-service-accounts.html
[creating-a-postgresql-db-instance]: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.PostgreSQL.html
[eks-pod-identity]: https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html
[iam-database-authentication-for-mariadb-mysql-and-postgresql]: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html
[iam-policy-for-db-access]: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.IAMPolicy.html
[iam-roles-for-service-accounts]: https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html
[associate-sa-role]: https://docs.aws.amazon.com/eks/latest/userguide/associate-service-account-role.html
[pod-id-association]: https://docs.aws.amazon.com/eks/latest/userguide/pod-id-association.html
[iam-db-accounts]: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.DBAccounts.html
[install]: /hub/howtos/install
[overview]: /hub/howtos/databases/overview
[vpc-security-groups-for-rds]: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.RDSSecurityGroups.html
