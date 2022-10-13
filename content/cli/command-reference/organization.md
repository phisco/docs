---
title: "up organization"
---
_Alias_: `up org`

Commands under `up organization` create and manage Upbound organizations.

{{< hint type="important" >}}
Only organizations can create [repositories]({{<ref "cli/command-reference/repository">}}), [robots]({{<ref "robot">}}) or [push packages]({{<ref "upbound-marketplace/packages" >}}) to the Upbound Marketplace. 
{{< /hint >}}

### `up organization create`

<!-- omit in toc -->
#### Arguments
_None_

Create an organization with the given name.  

<!-- omit in toc -->
#### Examples
```shell
up org create my-org
```

### `up organization list`

<!-- omit in toc -->
#### Arguments
_None_

List all organizations associated to the current user.

<!-- omit in toc -->
#### Examples
```shell
up org list
NAME           ROLE
my-org         owner
my-other-org   owner
```

### `up organization delete`

<!-- omit in toc -->
#### Arguments
* <organization name> _(required)_ - the name of the organization to delete

Deletes the given organization.

{{<hint type="warning" >}}
Deleting an organization removes all users from the organization, deletes all robots and robot tokens. 

This can not be undone.
{{< /hint >}}

<!-- omit in toc -->
#### Examples
```shell
up org delete my-org
Are you sure you want to delete this organization? [y/n]: y
Deleting orgainzation my-org. This cannot be undone.
my-org deleted
```