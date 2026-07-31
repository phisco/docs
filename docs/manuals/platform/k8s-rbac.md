---
title: Authorize actions in control planes
sidebar_position: 8
description: A guide to implementing and configuring Kubernetes RBAC in Upbound
---

:::note
For general RBAC in Upbound, read [Upbound RBAC][upbound-rbac].
:::

This guide explains how to authorize actions on resources in your control planes on Upbound. It uses the built-in [Kubernetes role-based access control][kubernetes-role-based-access-control] (RBAC) mechanism. This gives you fine-grained control over control plane access.

In a control plane on Upbound, Upbound RBAC and the control plane's Kubernetes
RBAC are integrated to authorize users to perform actions. They must have enough
permission according to either system. To authorize users with their Upbound
account, you must configure kubectl to authenticate to Upbound before running
any commands that require authorization.

## Define permissions and assign roles

Because control planes in Upbound are based on Kubernetes, you can use _ClusterRole_ and _Role_ objects to define RBAC rules in your control planes. Assign those rules using _ClusterRoleBinding_ and _RoleBinding_ objects:

- **Role:** A namespace-scoped group of resources and allowed operations that you can assign to a user or a group of users using a _RoleBinding_.
- **ClusterRole:** A cluster-scoped group of resources and allowed operations that you can assign to a user or a group of users using a _RoleBinding_ or _ClusterRoleBinding_.
- **RoleBinding:** A namespace-scoped assignment of a _Role_ or _ClusterRole_ to a user or group.
- **ClusterRoleBinding:** A cluster-scoped assignment of a _Role_ or _ClusterRole_ to a user or group.

If you plan to use namespaces in your control plane as an isolation mechanism between tenants, its recommended to use _RoleBinding_ objects. If namespace-scoping isn't a priority, use _ClusterRoleBinding_ objects instead.

### Define permissions using _Roles_ and _ClusterRoles_

Define permissions with a _Role_ or _ClusterRole_ object. A _Role_ defines access to resources in a single namespace of your control plane. A _ClusterRole_ defines access to resources in the entire control plane.

The example below demonstrates creating a `sql-instance-viewer` cluster-scoped role. This role permits viewing `sqlinstance` objects, a composite resource created with Crossplane.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sqlinstance-viewer
rules:
- apiGroups: ["aws.platform.upbound.io"]
  resources: ["sqlinstances"]
  verbs: ["get", "watch", "list"]
```

### Assign roles

The example below demonstrates how to assign the role in the earlier section to an Upbound user, robot, and control plane group member:

```yaml
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: sqlinstance-viewer-binding
  namespace: tenant1
subjects:
# An Upbound account user
- kind: User
  name: upbound:user:${username-on-upbound}
# A robot on Upbound
- kind: User
  name: upbound:robot:${robot-name}
  apiGroup: rbac.authorization.k8s.io
# An Upbound control plane group member
- kind: Group
  name: upbound:team:${team-uuid}
roleRef:
  kind: ClusterRole
  name: sqlinstance-viewer
  apiGroup: rbac.authorization.k8s.io
```

### RBAC manager

Each control plane in Upbound has a built-in Crossplane RBAC manager. This feature dynamically manages and binds RBAC roles. These roles grant subjects access to use the control plane as it gets extended by installing control plane software, such as providers, Crossplane composite resources, and more.


<details>

<summary> "Show example of RBAC manager roles"</summary>

```sh
kubectl get ClusterRoles -A
NAME                                                                                        CREATED AT
admin                                                                                       2025-03-12T18:57:25Z
cluster-admin                                                                               2025-03-12T18:57:25Z
controlplane-admin                                                                          2025-03-12T18:57:56Z
controlplane-admin-spaces-extras                                                            2025-03-12T18:57:56Z
controlplane-controller                                                                     2025-03-12T18:57:56Z
controlplane-controller-spaces-extras                                                       2025-03-12T18:57:56Z
controlplane-edit                                                                           2025-03-12T18:57:56Z
controlplane-edit-controller-spaces-extras                                                  2025-03-12T18:57:56Z
controlplane-edit-spaces-extras                                                             2025-03-12T18:57:56Z
controlplane-view                                                                           2025-03-12T18:57:56Z
controlplane-view-spaces-extras                                                             2025-03-12T18:57:56Z
crossplane                                                                                  2025-03-12T18:57:54Z
crossplane-admin                                                                            2025-03-12T18:57:54Z
crossplane-browse                                                                           2025-03-12T18:57:54Z
crossplane-edit                                                                             2025-03-12T18:57:54Z
crossplane-rbac-manager                                                                     2025-03-12T18:57:54Z
crossplane-view                                                                             2025-03-12T18:57:54Z
crossplane:aggregate-to-admin                                                               2025-03-12T18:57:54Z
crossplane:aggregate-to-browse                                                              2025-03-12T18:57:54Z
crossplane:aggregate-to-edit                                                                2025-03-12T18:57:54Z
crossplane:aggregate-to-view                                                                2025-03-12T18:57:54Z
crossplane:allowed-provider-permissions                                                     2025-03-12T18:57:54Z
crossplane:composite:xnetworks.azure.platform.upbound.io:aggregate-to-browse                2025-03-15T15:26:08Z
crossplane:composite:xnetworks.azure.platform.upbound.io:aggregate-to-crossplane            2025-03-15T15:26:08Z
crossplane:composite:xnetworks.azure.platform.upbound.io:aggregate-to-edit                  2025-03-15T15:26:08Z

```
</details>

## How Upbound RBAC works in a control plane

### Predefined roles

Each control plane offers predefined _ClusterRoles_ related to granting permissions for Crossplane objects:

- **controlplane-view** lets subjects have read-only access to all Crossplane resources.
- **controlplane-edit** lets subjects have full access to composite resources.
- **controlplane-admin** lets subjects have full access _and_ the ability to grant others access by managing role bindings.

Whenever control plane software gets installed or uninstalled, the RBAC manager handles the lifecycle of _ClusterRoles_ and _ClusterRoleBindings_ to aggregate permissions up to these predefined roles.

#### controlplane-view

The `controlplane-view` _ClusterRole_ has the following permissions:

- read-only access to all Crossplane types
- read-only access to all namespaces and events (even those unrelated to Crossplane).

View the full RBAC policy by running the following command on your control plane:

```sh
kubectl describe clusterrole controlplane-view
```

#### controlplane-edit

The `controlplane-edit` _ClusterRole_ has the following permissions:

- full access to all Crossplane types
- full access to all secrets (even those unrelated to Crossplane)
- read-only access to all namespaces and events (even those unrelated to Crossplane).

View the full RBAC policy by running the following command on your control plane:

```sh
kubectl describe clusterrole controlplane-edit
```

#### controlplane-admin

The `controlplane-admin` ClusterRole has the following permissions:

- full access to all Crossplane types
- full access to all secrets and namespaces (even those unrelated to Crossplane)
- read-only access to all cluster RBAC roles, CustomResourceDefinitions and events
ability to bind RBAC roles to other entities.

View the full RBAC policy by running the following command on your control plane:

```sh
kubectl describe clusterrole controlplane-admin
```

### Upbound RBAC roles in a control plane

Roles granted with [Upbound RBAC][upbound-rbac-1] transitively affect what a user can do in a control plane. Upbound RBAC permissions are granted at the control plane group scope to teams. A team is a group of subjects consisting of users and robots. Here is how roles granted at the group scope transitively affect permissions in a control plane in that group:

- **group viewer** means users and robots receive the _ClusterRole_ `controlplane-view` in the control plane. This role gets bound for all subjects with the `upbound:controlplane:view` group attribute.
- **group editor** means users and robots receive the _ClusterRole_ `controlplane-edit` in the control plane. This role gets bound for all subjects with the `upbound:controlplane:edit` group attribute.
- **group administrator** means users and robots receive the _ClusterRole_ `controlplane-admin` in the control plane. This role gets bound for all subjects with the `upbound:controlplane:admin` group attribute.

## Example usage

The example below demonstrates step-by-step how to give a tenant in a control plane limited ability to create only certain APIs.

### Create a control plane in a group

As an administrator, create a control plane in a new control plane group:

```ini
up ctx <your-org>/upbound-gcp-us-central-1
up group create group1
up ctp create prod-ctp -g group1
```

Connect to the control plane and configure it. For this example, you can install [configuration-azure-data][configuration-azure-data]:

```ini
up ctx <your-org>/upbound-gcp-us-central-1/group1/prod-ctp
up ctp configuration install xpkg.upbound.io/upbound/configuration-azure-database
```

### Create a team and assign tenants to it

Create a team:

```ini
up team create team1
```
Use the [Upbound Console][upbound-console] to add the desired users to the team.

### Use Upbound RBAC to assign a role to the team

First, find the ID of the team:

```ini
up team list
```

Assign the `control plane group viewer` role to the team.

```yaml
apiVersion: authorization.spaces.upbound.io/v1alpha1
kind: ObjectRoleBinding
metadata:
  name: group1-viewer-binding
  namespace: group1
spec:
  object:
    apiGroup: core
    resource: namespaces
    name: group1
  subjects:
  - kind: UpboundTeam
    name: <your-team-uuid>
    role: viewer
```


You can also use the [Upbound Console][upbound-console-2] to assign this role.

The users in `team1` now have a view-only experience on the control plane. To let them create _only_ a certain set of APIs, you need to define _Roles_ and _RoleBindings_ on the control plane itself.

### Configure RBAC on the control plane

Change your kubecontext to the control plane:

```ini
up ctx <your-org>/upbound-gcp-us-central-1/group1/prod-ctp
```

Create a namespace in the control plane for the team:

```ini
kubectl create namespace team1
```

Create the _Role_ and _RoleBinding_ to let users in this namespace create and edit `SQLInstances`. Apply the following manifests to your control plane:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: crossplane:composite:xsqlinstances.azure.platform.upbound.io:edit
  namespace: team1
rules:
- apiGroups:
  - azure.platform.upbound.io
  resources:
  - xsqlinstances
  - xsqlinstances/status
  verbs:
  - '*'
- apiGroups:
  - azure.platform.upbound.io
  resources:
  - sqlinstances
  - sqlinstances/status
  verbs:
  - '*'
```

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: sqlinstance-edit
  namespace: team1
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: crossplane:composite:xsqlinstances.azure.platform.upbound.io:edit
subjects:
- kind: Group
  name: upbound:team:<team-uuid>
```

Users in `team1` can now access the control plane and only have the ability to manage _SQLInstances_ in their designated namespace.


[upbound-rbac]: /manuals/platform/rbac
[upbound-rbac-1]: /manuals/platform/rbac
[upbound-console]: /manuals/platform/teams/#add-users
[upbound-console-2]: /manuals/platform/rbac/#assign-group-role-permissions
[kubernetes-role-based-access-control]: https://kubernetes.io/docs/reference/access-authn-authz/rbac/
[configuration-azure-data]: https://marketplace.upbound.io/configurations/upbound/configuration-azure-database
