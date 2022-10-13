---
title: "up robot token"
---
Manage robot authentication tokens for existing robot accounts with `up robot token`.

- [`up robot token create`](#up-robot-token-create)
- [`up robot token delete`](#up-robot-token-delete)
- [`up robot token list`](#up-robot-token-list)

{{<hint type="important" >}}
Robot accounts are only supported for [organizations]({{<ref "../organization" >}}).  
User accounts can't create robots.
{{< /hint >}}

<!-- vale gitlab.SubstitutionWarning = NO-->
<!-- don't flag an error on shortcode information argument -->
{{< hint type="info" >}}
<!-- vale gitlab.SubstitutionWarning = YES-->
The Upbound Cloud Platform requires authentication to an organization with [`up login -a`]({{<ref "login" >}}) before using `up robot token create`.
{{< /hint >}}

Installing Kubernetes resources from private repositories or installing Official Providers requires robot tokens.  
Find more information on creating Kubernetes secrets with robot tokens in the [Marketplace Authentication]({{<ref "upbound-marketplace/authentication" >}}) section.

### `up robot token create`

<!-- omit in toc -->
#### Arguments
* `<robot name>` _(required)_ - name of the robot account
* `<token name>` _(required)_ - name of the robot token
* `--output=<file_location>` _(required)_ - the path and filename of the generated JSON robot token

Creates a new robot token and generates a JSON file containing the robot's credentials.

{{< hint type="caution" >}}
The JSON file contains the robot username called `accessId` and password called `token`.

There's no way to recover the `token` value if it's lost. 
{{< /hint >}}

<!-- omit in toc -->
#### Examples
```shell
up robot token create my-robot my-token ~/my-robot-token.json
my-org/my-robot/my-token created
```

```shell
cat ~/my-robot-token.json
vagrant@kubecontroller-01:~$ cat token.json
{"accessId":"a857e667-526a-8424-8dff-d29d3204adae","token":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhODU3ZTY2Ny01MjZhLTQwNDItOGRlMy1kMjlkMzIwNGFkYWUiLCJzdWIiOiJyb2JvdHwzZjc2ZWVjNS1iN2UwLTRmNmUtYWVlYy04YWRiZWMyYzQ0YTYifQ.F00nFGsINl3wrRvI6YQd4AlwevdiZZZeiJFZXi7QxZ3pYEhDjeL0pLw-ln-qyFLQXNX42jw-n0sAlmV6T1IVU9fLjQOaPIiFbhovlf4uNlPL51ih3qwswMC7kgdzCpg3e4l3HngEsHsIhnv_5ipliJXx7Pk7eRfybDQyGM7nodbd5Zk-bOI9MMRJPrwxanlRoPnt3oiUhSBcmHaJh7GbSs_8bCKq1hSK1HK6nj8nHgS2zOI3oe1Xrk1SKnNw2wC_MpPDxpoW9xitMapjzhKdzdl5T3peIrsEW9z2i-Sm1yKFpe80a6wRKNgiK1caxj7gjPVuvEoVop-uKayN9DMViQ"}
```

### `up robot token delete`

<!-- omit in toc -->
#### Arguments
* `<robot name>` _(required)_ - name of the robot account
* `<token name>` _(required)_ - name of the robot token
  
Deletes a given robot token from a given robot account.

Deleting a robot token is permanent. There isn't a way to retrieve a delete robot token.

The command asks to confirm deleting the token.

<!-- omit in toc -->
#### Examples
```shell
up robot token delete my-robot my-token
Are you sure you want to delete this robot token? [y/n]: y
Deleting robot token my-org/my-robot/my-token. This cannot be undone.
my-org/my-robot/my-token deleted
```

### `up robot token list`

<!-- omit in toc -->
#### Arguments
* `<robot name>` _(required)_ - name of the robot

Lists all robot tokens associated with the given robot account.
  
<!-- omit in toc -->
#### Examples
```shell
up robot token list my-robot
NAME       ID                                     CREATED
my-token   a857e667-526a-8424-8dff-d29d3204adae   28m
```