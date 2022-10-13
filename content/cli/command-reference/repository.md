---
title: "up repository"
---
_Alias_: `up repo`  

Commands under `up repository` create and manage Upbound repository accounts.

### `up repository create`

<!-- omit in toc -->
#### Arguments
_None_

Create a repository with the given name.  

<!-- omit in toc -->
#### Examples
```shell
up repository create my-org
```

### `up repository list`

<!-- omit in toc -->
#### Arguments
_None_

List all repository associated to the current user.

<!-- omit in toc -->
#### Examples
```shell
up repo list
NAME      TYPE      PUBLIC   UPDATED
my-repo   unknown   false    n/a
```

### `up repository delete`

<!-- omit in toc -->
#### Arguments
* <repository name> _(required)_ - the name of the repository to delete

Deletes the given repository.

{{<hint type="warning" >}}
Deleting a repository removes all packages from the repository and impacts all users in an organization.

This can not be undone.
{{< /hint >}}

<!-- omit in toc -->
#### Examples
```shell
up repository delete my-repo
Are you sure you want to delete this repository? [y/n]: y
Deleting repository my-repo. This cannot be undone.
my-repo deleted
```