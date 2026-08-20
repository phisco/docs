---
title: Hub RBAC
sidebar_position: 1
description: A guide using Hub RBAC in disconnected spaces
---

:::important
This guide is only applicable for administrators who've deployed self-hosted Spaces. For general RBAC in Upbound, read [Upbound RBAC][upbound-rbac].
:::

This guide explains how to authorize actions on resources in a disconnected Space, on the Kubernetes cluster hosting the Spaces software. With Kubernetes Hub RBAC, you can use traditional Kubernetes RBAC to define roles and permissions.

<!-- vale Google.Headings = NO -->
<!-- vale Microsoft.HeadingAcronyms = NO -->
## Enable Kubernetes Hub authorization

To enable Kubernetes Hub Authentication in your Space, you need:
- A Kubernetes cluster with RBAC enabled
- `authorization.hubRBAC` set to `true` (enabled by default)

Users can authenticate to the single-tenant Space with their Kubernetes credentials using this method.

## Configure Kubernetes RBAC

To configure Kubernetes RBAC in your Disconnected Space, you need to create `ClusterRoles` and `Roles` for defining access to your resources. For example:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: controlplane-getter
rules:
- apiGroups: ["spaces.upbound.io"]
  resources: ["controlplanes"]
  verbs: ["get", "list", "watch"]
```

Next, create `ClusterRoleBindings` and `RoleBindings` to assign roles to subjects like users, groups, or service accounts:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: controlplane-getters
subjects:
- kind: User
  name: upbound:(user|robot):<username>
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: controlplane-getter
  apiGroup: rbac.authorization.k8s.io
```

The `subject` in this example can contain teams (`upbound:team:<uuid>`) or org roles (`upbound:org-role:admin|member`) depending on your role needs.

## Upbound RBAC integration
<!-- vale Google.Headings = YES -->
<!-- vale Microsoft.HeadingAcronyms = YES -->

<!-- vale Google.WordList = NO -->
You can use the special verbs `admin`, `edit` and `view` for giving a subject access to a control plane:
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: controlplane-editor
rules:
- apiGroups: ["spaces.upbound.io"]
  resources: ["controlplanes/k8s"]
  verbs: ["edit"] # or "admin" or "view", depending on access level
```
<!-- vale Google.WordList = YES -->


[upbound-rbac]: /manuals/platform/rbac
