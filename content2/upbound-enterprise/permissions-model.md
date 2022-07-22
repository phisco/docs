---
title: "Permissions Model"
metaTitle: "Permissions Model"
metaDescription: "Permissions Model"
rank: 58
---


This page describes the different types of permissions and access rights Upbound
Enterprise customers can setup in their self-hosted Upbound deployment. Broad
permissions are managed at the global organization scope, while fine-grained
access to control planes is managed via teams.

## Permission Types

Users in an organization are given one of two distinct roles:

- `Administrator`: Administrators have full management access to the
  organization, meaning that they can:
  - Create, update, and delete any control plane.
  - Invite new organization members and remove existing ones.
  - Create, update, and delete team members and permissions.
  - View and manage organization settings.
- `Member`: Members are able to access the organization, but all additional
  permissions must be given via teams.

Organization administrators may create teams, and add users and robot accounts
to those teams. User accounts are added to a team with one of the following
roles:

- `Owner`: Owners can add and removes members of the team, and are given all
  permissions allocated to the team.
- `Member`: Members are given all permissions allocated to the team.

Robot accounts are considered members of a team and cannot be given owner access.

Organization administrators may allocate control plane permissions to all
members of a team by adding one of the following roles for each control plane:

* `Viewer`: Viewers may view and connect to the control plane, but are limited
  by [RBAC] to 'view-only' operations. A viewer may see what resources are
  managed by the control plane, but may not create, update, or delete resources.
* `Editor`: Editors may view and connect to control planes, and are granted full
  access to operate on Crossplane resources.
* `Owner`: Owners are granted the same level of access to a control plane as
  editors, but may also edit and delete the control plane itself.


<!-- Links -->
[security documentation]: ../security
