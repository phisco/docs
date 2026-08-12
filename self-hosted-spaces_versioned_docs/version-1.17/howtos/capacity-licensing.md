---
title: Capacity Licensing
sidebar_position: 60
description: A guide for capacity-based licensing in self-hosted Spaces
plan: "enterprise"
---

<!-- vale write-good.TooWordy = NO -->
<!-- vale write-good.Weasel = NO -->

<Enterprise />
This guide explains how to configure and monitor capacity-based licensing in
self-hosted Upbound Spaces. Capacity licensing provides a simplified billing
model for disconnected or air-gapped environments where automated usage
reporting isn't possible.

:::info
Spaces `v1.15` and later support Capacity Licensing as an
alternative to the traditional usage-based billing model described in the
[Self-Hosted Space Billing][space-billing] guide.
:::

<!-- vale gitlab.HeadingContent = NO -->
## Overview
<!-- vale gitlab.HeadingContent = YES -->

Capacity licensing allows organizations to purchase a fixed capacity of
resources upfront. The Spaces software tracks usage locally and provides
visibility into consumption against your purchased capacity, all without
requiring external connectivity to Upbound's services.

### Key concepts

- **Resource Hours**: The primary billing unit representing all resources
  managed by Crossplane over time. This includes managed resources,
  composites (XRs), claims (XRCs), and all composed resources - essentially
  everything Crossplane manages. The system aggregates resource counts over each
  hour using trapezoidal integration to accurately account for changes in
  resource count throughout the hour.
- **Operations**: The number of Operations invoked by Crossplane.
- **License Capacity**: The total amount of resource hours and operations included in your license.
- **Usage Tracking**: Continuous monitoring of consumption with real-time utilization percentages.

### How it works

1. Upbound provides you with a license file containing your purchased capacity
2. You configure a `SpaceLicense` in your Spaces cluster
3. The metering system automatically:
   - Collects measurements from all control planes every minute
   - Aggregates usage data into hourly intervals
   - Stores usage data in a local PostgreSQL database
   - Updates the `SpaceLicense` status with current consumption

## Prerequisites

### PostgreSQL database

Capacity licensing requires a PostgreSQL database to store usage measurements. You can use:

- An existing PostgreSQL instance
- A managed PostgreSQL service (AWS RDS, Azure Database, Google Cloud SQL)
- A PostgreSQL instance deployed in your cluster

The database must be:

- Accessible from the Spaces cluster
- Configured with a dedicated database and credentials

#### Example: Deploy PostgreSQL with CloudNativePG

If you don't have an existing PostgreSQL instance, you can deploy one in your
cluster using [CloudNativePG] (CNPG). CNPG is a Kubernetes operator that
manages PostgreSQL clusters.

1. Install the CloudNativePG operator:

```bash
kubectl apply -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.24/releases/cnpg-1.24.1.yaml
```

2. Create a PostgreSQL cluster for metering:

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: metering-postgres
  namespace: upbound-system
spec:
  instances: 1
  imageName: ghcr.io/cloudnative-pg/postgresql:16
  bootstrap:
    initdb:
      database: metering
      owner: metering
      postInitApplicationSQL:
        - ALTER ROLE "metering" CREATEROLE;
  storage:
    size: 5Gi
  # Optional: Configure resources for production use
  # resources:
  #   requests:
  #     memory: "512Mi"
  #     cpu: "500m"
  #   limits:
  #     memory: "1Gi"
  #     cpu: "1000m"
---
apiVersion: v1
kind: Secret
metadata:
  name: metering-postgres-app
  namespace: upbound-system
  labels:
    cnpg.io/reload: "true"
stringData:
  username: metering
  password: "your-secure-password-here"
type: kubernetes.io/basic-auth
```

```bash
kubectl apply -f metering-postgres.yaml
```

3. Wait for the cluster to be ready:

```bash
kubectl wait --for=condition=ready cluster/metering-postgres -n upbound-system --timeout=5m
```

4. You can access the PostgreSQL cluster at `metering-postgres-rw.upbound-system.svc.cluster.local:5432`.

:::tip
For production deployments, consider:
- Increasing `instances` to 3 for high availability
- Configuring [backups] to object storage
- Setting appropriate resource requests and limits
- Using a dedicated storage class with good I/O performance
:::

### License file

Contact your Upbound sales representative to obtain a license file for your organization. The license file contains:
- Your unique license ID
- Purchased capacity (resource hours and operations)
- License validity period
- Any usage restrictions (such as cluster UUID pinning)

## Configuration

### Step 1: Create database credentials secret

Create a Kubernetes secret containing your PostgreSQL password using the pgpass format:

```bash
# Create a pgpass file with format: hostname:port:database:username:password
# Note: The database name and username must be 'metering'
# For CNPG clusters, use the read-write service endpoint: <cluster-name>-rw.<namespace>.svc.cluster.local
echo "metering-postgres-rw.upbound-system.svc.cluster.local:5432:metering:metering:your-secure-password-here" > pgpass

# Create the secret
kubectl create secret generic metering-postgres-credentials \
  -n upbound-system \
  --from-file=pgpass=pgpass

# Clean up the pgpass file
rm pgpass
```

The secret must contain a single key:
- **`pgpass`**: PostgreSQL password file in the format `hostname:port:metering:metering:password`

:::note
The database name and username are fixed as `metering`. Ensure your PostgreSQL instance has a database named `metering` with a user `metering` that has appropriate permissions.

If you deployed PostgreSQL using CNPG as shown in the example above, the password should match what you set in the `metering-postgres-app` secret.
:::

:::tip
For production environments, consider using external secret management solutions:
- [External Secrets Operator][eso]
- Cloud-specific secret managers (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager)
:::

### Step 2: Enable metering in Spaces

Enable the metering feature when installing or upgrading Spaces:

<Tabs>

<TabItem value="Helm" label="Helm">

```bash {hl_lines="2-7"}
helm -n upbound-system upgrade --install spaces ... \
  --set "metering.enabled=true" \
  --set "metering.storage.postgres.connection.url=metering-postgres-rw.upbound-system.svc.cluster.local:5432" \
  --set "metering.storage.postgres.connection.credentials.secret.name=metering-postgres-credentials" \
  --set "metering.interval=1m" \
  --set "metering.workerCount=10" \
  --set "metering.aggregationInterval=1h" \
  --set "metering.measurementRetentionDays=30"
  ...
```

</TabItem>

<TabItem value="up CLI" label="up CLI">

```bash {hl_lines="2-7"}
up space init ... \
  --set "metering.enabled=true" \
  --set "metering.storage.postgres.connection.url=metering-postgres-rw.upbound-system.svc.cluster.local:5432" \
  --set "metering.storage.postgres.connection.credentials.secret.name=metering-postgres-credentials" \
  --set "metering.interval=1m" \
  --set "metering.workerCount=10" \
  --set "metering.aggregationInterval=1h" \
  --set "metering.measurementRetentionDays=30"
  ...
```

</TabItem>

</Tabs>

#### Configuration options

| Option | Default | Description |
|--------|---------|-------------|
| `metering.enabled` | `false` | Enable the metering feature |
| `metering.storage.postgres.connection.url` | - | PostgreSQL host and port (format: `host:port`, required) |
| `metering.storage.postgres.connection.credentials.secret.name` | - | Name of the secret containing PostgreSQL credentials (required) |
| `metering.storage.postgres.connection.sslmode` | `require` | SSL mode for PostgreSQL connection (`disable`, `allow`, `prefer`, `require`, `verify-ca`, `verify-full`) |
| `metering.storage.postgres.connection.ca.name` | - | Name of the secret containing CA certificate for TLS connections (optional) |
| `metering.interval` | `1m` | How often to collect measurements from control planes |
| `metering.workerCount` | `10` | Number of parallel workers for measurement collection |
| `metering.aggregationInterval` | `1h` | How often to aggregate measurements into hourly usage data |
| `metering.measurementRetentionDays` | `30` | Days to retain raw measurements (0 = indefinite) |


#### Database sizing and retention

The metering system uses two PostgreSQL tables to track usage:

**Raw measurements table** (`measurements`):
- Stores point-in-time snapshots collected every measurement interval (default: 1 minute)
- One row per control plane per interval
- Affected by the `measurementRetentionDays` setting
- Used for detailed auditing and troubleshooting

**Aggregated usage table** (`hourly_usage`):
- Stores hourly aggregated resource hours and operations per license
- One row per hour per license
- Never deleted (required for accurate license tracking)
- Grows much slower than raw measurements

##### Storage sizing guidelines

Estimate your PostgreSQL storage needs based on these factors:
<!-- vale Upbound.Ampersand = NO -->

| Deployment Size | Control Planes | Measurement Interval | Retention Days | Raw Measurements | Indexes & Overhead | Total Storage |
|----------------|----------------|---------------------|----------------|------------------|-------------------|---------------|
| Small | 10 | 1m | 30 | ~85 MB | ~40 MB | **~125 MB** |
| Medium | 50 | 1m | 30 | ~430 MB | ~215 MB | **~645 MB** |
| Large | 200 | 1m | 30 | ~1.7 GB | ~850 MB | **~2.5 GB** |
| Large (90-day retention) | 200 | 1m | 90 | ~5.2 GB | ~2.6 GB | **~7.8 GB** |
<!-- vale Upbound.Ampersand = YES -->
The aggregated hourly usage table adds minimal overhead (~50 KB per year per license).

**Formula for custom calculations**:
```
Daily measurements per control plane = (24 * 60) / interval_minutes
Total rows = control_planes × daily_measurements × retention_days
Storage (MB) ≈ (total_rows × 200 bytes) / 1,048,576 × 1.5 (with indexes)
```

##### Retention behavior

The `measurementRetentionDays` setting controls retention of raw measurement data:

- **Default: 30 days** - Balances audit capabilities with storage efficiency
- **Set to 0**: Disables cleanup, retains all raw measurements indefinitely
- **Cleanup runs**: Every aggregation interval (default: hourly)
- **What's kept forever**: Aggregated hourly usage data (needed for license tracking)
- **What's cleaned up**: Raw point-in-time measurements older than retention period

**Recommendations**:
- **30 days**: For most troubleshooting and short-term auditing
- **60 to 90 days**: For environments requiring extended audit trails
- **Unlimited (0)**: Only for environments with ample storage or specific compliance requirements

:::note
Increasing retention period linearly increases storage requirements for raw measurements. The aggregated hourly data is always retained regardless of this setting.
:::

### Step 3: Apply your license

Use the `up` CLI to apply your license file:

```bash
up space license apply /path/to/license.json
```

This command automatically:
- Creates a secret containing your license file in the `upbound-system` namespace
- Creates the `SpaceLicense` resource configured to use that secret

:::tip
You can specify a different namespace for the license secret using the `--namespace` flag:
```bash
up space license apply /path/to/license.json --namespace my-namespace
```
:::

<details>
<summary>Alternative: Manual kubectl approach</summary>

If you prefer not to use the `up` CLI, you can manually create the resources:

1. Create the license secret:

```bash
kubectl create secret generic space-license \
  -n upbound-system \
  --from-file=license.json=/path/to/license.json
```

2. Create the SpaceLicense resource:

```yaml
apiVersion: admin.spaces.upbound.io/v1alpha1
kind: SpaceLicense
metadata:
  name: space
spec:
  secretRef:
    name: space-license
    namespace: upbound-system
    key: license.json
```

```bash
kubectl apply -f spacelicense.yaml
```

:::important
You **must** name the `SpaceLicense` resource `space`. This resource is a singleton and only one can exist in the cluster.
:::

</details>

## Monitoring usage

### Check license status

Use the `up` CLI to view your license details and current usage:

```bash
up space license show
```

Example output:

```
Spaces License Status:  Valid (License is valid)

Created:        2024-01-01T00:00:00Z
Expires:        2025-01-01T00:00:00Z

Plan:           enterprise

Resource Hour Limit:    1000000
Operation Limit:        500000

Enabled Features:
- spaces
- query-api
- backup-restore
```

The output shows:
- License validity status and any validation messages
- Creation and expiration dates
- Your commercial plan tier
- Capacity limits for resource hours and operations
- Enabled features in your license
- Any restrictions (such as cluster UUID pinning)

<details>
<summary>Alternative: View detailed status with kubectl</summary>

For detailed information including usage statistics, use kubectl:

```bash
kubectl get spacelicense space -o yaml
```

Example output showing usage data:

```yaml
apiVersion: admin.spaces.upbound.io/v1alpha1
kind: SpaceLicense
metadata:
  name: space
spec:
  secretRef:
    name: space-license
    namespace: upbound-system
status:
  conditions:
  - type: LicenseValid
    status: "True"
    reason: Valid
    message: "License is valid"
  id: "lic_abc123xyz"
  plan: "enterprise"
  capacity:
    resourceHours: 1000000
    operations: 500000
  usage:
    resourceHours: 245680
    operations: 12543
    resourceHoursUtilization: "24.57%"
    operationsUtilization: "2.51%"
    firstMeasurement: "2024-01-15T10:00:00Z"
    lastMeasurement: "2024-02-10T14:30:00Z"
  createdAt: "2024-01-01T00:00:00Z"
  expiresAt: "2025-01-01T00:00:00Z"
  enabledFeatures:
  - "spaces"
  - "query-api"
  - "backup-restore"
```

</details>

### Understanding the status fields

| Field | Description |
|-------|-------------|
| `status.id` | Unique license identifier |
| `status.plan` | Your commercial plan (community, standard, enterprise) |
| `status.capacity` | Total capacity included in your license |
| `status.usage.resourceHours` | Total resource hours consumed |
| `status.usage.operations` | Total operations performed |
| `status.usage.resourceHoursUtilization` | Percentage of resource hours capacity used |
| `status.usage.operationsUtilization` | Percentage of operations capacity used |
| `status.usage.firstMeasurement` | When usage tracking began |
| `status.usage.lastMeasurement` | Most recent usage update |
| `status.expiresAt` | License expiration date |

### Monitor with kubectl

Watch your license utilization in real-time:

```bash
kubectl get spacelicense space -w
```

Short output format:

```
NAME    PLAN         VALID   REASON   AGE
space   enterprise   True    Valid    45d
```

## Managing licenses

### Updating your license

To update your license with a new license file (for example, when renewing or upgrading capacity), apply the new license:

```bash
up space license apply /path/to/new-license.json
```

This command replaces the existing license secret and updates the SpaceLicense resource.

### Removing a license

To remove a license:

```bash
up space license remove
```

This command:
- Prompts for confirmation before proceeding
- Removes the license secret

To skip the confirmation prompt, use the `--force` flag:

```bash
up space license remove --force
```

## Troubleshooting

### License not updating

If the license status doesn't update with usage data:

1. **Check metering controller logs**:
   ```bash
   kubectl logs -n upbound-system deployment/spaces-controller -c metering
   ```

2**Check if the system captures your measurements**:

   ```bash
   # Connect to PostgreSQL and query the measurements table
   kubectl exec -it <postgres-pod> -- psql -U <user> -d <database> \
     -c "SELECT COUNT(*) FROM measurements WHERE timestamp > NOW() - INTERVAL '1 hour';"
   ```

### High utilization warnings

If you're approaching your capacity limits:

1. **Review resource usage** by control plane to identify high consumers
2. **Contact your Upbound sales representative** to discuss capacity expansion
3. **Optimize managed resources** by cleaning up unused resources

### License validation failures

If your license shows as invalid:

1. **Check expiration date**: `kubectl get spacelicense space -o jsonpath='{.status.expiresAt}'`
2. **Verify license file integrity**: Ensure the secret contains valid JSON
3. **Check for cluster UUID restrictions**: Upbound pins some licenses to
   specific clusters 
4. **Review controller logs** for detailed error messages

## Differences from traditional billing

### Capacity licensing

- ✅ Works in disconnected environments
- ✅ Provides real-time usage visibility
- ✅ No manual data export required
- ✅ Requires PostgreSQL database
- ✅ Fixed capacity model

### Traditional billing (object storage)
<!-- vale gitlab.Uppercase = NO -->

- ❌ Requires periodic manual export
- ❌ Delayed visibility into usage
- ✅ Works with S3/Azure Blob/GCS
- ❌ Requires cloud storage access
- ✅ Pay-as-you-go model
<!-- vale gitlab.Uppercase = NO -->
## Best practices

### Database management
<!-- vale Microsoft.Adverbs = NO -->
1. **Regular backups**: Back up your metering database regularly to preserve usage history
2. **Monitor database size**: Set appropriate retention periods to manage storage growth
3. **Use managed databases**: Consider managed PostgreSQL services for production
4. **Connection pooling**: Use connection pooling for better performance at scale
<!-- vale Microsoft.Adverbs = YES -->
### License management

1. **Monitor utilization**: Set up alerts before reaching 80% capacity
2. **Plan renewals early**: Start renewal discussions 60 days before expiration
3. **Track grace periods**: Note the `gracePeriodEndsAt` date for planning
4. **Secure license files**: Treat license files as sensitive credentials

### Operational monitoring

1. **Set up dashboards**: Create Grafana dashboards for usage trends
2. **Enable alerting**: Configure alerts for high utilization and expiration
3. **Regular audits**: Periodically review usage patterns across control planes
4. **Capacity planning**: Use historical data to predict future capacity needs

## Next steps

- Learn about [Observability] to monitor your Spaces deployment
- Explore [Backup and Restore][backup-restore] to protect your control plane data
- Review [Self-Hosted Space Billing][space-billing] for the traditional billing model
- Contact [Upbound Sales][sales] to discuss capacity licensing options


[space-billing]: /self-hosted-spaces/howtos/billing
[CloudNativePG]: https://cloudnative-pg.io/
[backups]: https://cloudnative-pg.io/documentation/current/backup_recovery/
[backup-restore]: /self-hosted-spaces/howtos/backup-and-restore
[sales]: https://www.upbound.io/contact-us
[eso]: https://external-secrets.io/
[Observability]: /self-hosted-spaces/howtos/observability
<!-- vale write-good.Weasel = YES -->
<!-- vale write-good.TooWordy = YES -->
