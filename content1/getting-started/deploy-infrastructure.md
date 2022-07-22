---
title: "Deploy Infrastructure"
metaTitle: "Deploy Infrastructure"
metaDescription: "Deploy Infrastructure on Upbound"
rank: 4
---

The `Configuration` package we installed in the last section:

- Defines a `CompositePostgreSQLInstance` XR.
- Offers a `PostgreSQLInstance` claim (XRC) for said XR.
- Creates a `Composition` that can satisfy our XR.

This means that an app team could now can create a `PostgreSQLInstance` XRC in
their namespace to provision a PostgreSQL instance and all the supporting
infrastructure (VPCs, firewall rules, resource groups, etc) that it may need!

# Deploy Infrastructure

Let's go ahead and create a `PostgreSQLInstance` to show how we can deploy
infrastructure using our control plane.

```yaml
apiVersion: database.example.org/v1alpha1
kind: PostgreSQLInstance
metadata:
  name: my-db
  namespace: default
spec:
  parameters:
    storageGB: 20
  compositionSelector:
    matchLabels:
      uxp-guide: getting-started
  writeConnectionSecretToRef:
    name: db-conn
```

```console
kubectl apply -f https://raw.githubusercontent.com/upbound/universal-crossplane/main/docs/getting-started/claim.yaml
```

After creating the `PostgreSQLInstance` UXP will begin provisioning a database
instance on your provider of choice. Once provisioning is complete, you should
see `READY: True` in the output when you run:

```console
kubectl get postgresqlinstance my-db
```

Note: while waiting for the `PostgreSQLInstance` to become ready, you may want
to look at other resources in your cluster. The following commands will allow
you to view groups of Crossplane resources:

- `kubectl get claim`: get all resources of all claim kinds, like
  `PostgreSQLInstance`.
- `kubectl get composite`: get all resources that are of composite kind, like
  `CompositePostgreSQLInstance`.
- `kubectl get managed`: get all resources that represent a unit of external
  infrastructure.
- `kubectl get aws`: get all resources related to AWS.
- `kubectl get crossplane`: get all resources related to Crossplane.

Try the following command to see whether your provisioned resources are ready:

```console
kubectl get managed -l crossplane.io/claim-name=my-db
```

Once your `PostgreSQLInstance` is ready, you should see a `Secret` in the
`default` namespace named `db-conn` that contains keys that we defined in XRD.
If they were filled by the [composition], then they should appear:

```console
$ kubectl describe secrets db-conn
Name:         db-conn
Namespace:    default
...

Type:  connection.crossplane.io/v1alpha1

Data
====
password:  27 bytes
port:      4 bytes
username:  25 bytes
endpoint:  45 bytes
```

# View in Upbound Dashboard

Because our control plane is attached to Upbound, we can view our infrastructure
and the relationship between the claim (XRC) we created and the resources that
represent the external infrastructure that was provisioned.

![Deploy](../images/deploy-infra.png)

# Next Steps

You've completed the getting started guide! To continue learning how you can
design your platform on Upbound, take a look at [building your own
`Configuration` package].

[composition]: https://crossplane.io/docs/master/concepts/composition.html
[building your own `Configuration` package]: ../../uxp/build-configuration
