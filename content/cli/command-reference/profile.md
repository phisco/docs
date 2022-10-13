---
title: "up profile"
---
View and manage `up` command-line profiles with `up profile` commands.

- [`up profile config`](#up-profile-config)
    - [Set a key-value pair](#set-a-key-value-pair)
    - [Unset a key-value pair](#unset-a-key-value-pair)
- [`up profile current`](#up-profile-current)
- [`up profile list`](#up-profile-list)
- [`up profile use`](#up-profile-use)
- [`up profile view`](#up-profile-view)
### `up profile config`

<!-- omit in toc -->
#### Arguments
* `set <key> <value>` - set a given key-value pair
* `unset <key> <value>` - unset a given key-value pair
* `-f,--file = <profile JSON file>` - a JSON file of key-value pairs

Settings apply to the current profile in use.  
Supply a JSON file of settings for bulk changes.

<!-- omit in toc -->
#### Examples
##### Set a key-value pair
```shell
up profile config set color blue
```

##### Unset a key-value pair
```shell
up profile config unset color
```


### `up profile current`

<!-- omit in toc -->
#### Arguments
_None_

View the current profile settings.

<!-- omit in toc -->
#### Examples
```json
$ up profile current
{
    "default": {
        "id": "my-name",
        "type": "user",
        "session": "REDACTED",
        "account": "my-org",
        "base": {
            "color": "blue"
        }
    }
}
```
### `up profile list`

<!-- omit in toc -->
#### Arguments
_None_

List all configured profiles.
<!-- omit in toc -->
#### Examples
```shell
up profile list
CURRENT   NAME      TYPE   ACCOUNT
*         default   user   my-org
```
### `up profile use`

<!-- omit in toc -->
#### Arguments
* `<profile name>` _(required)_ - name of the profile to use
<!-- omit in toc -->
#### Examples
```shell
up profile use test
```

### `up profile view`

<!-- omit in toc -->
#### Arguments
_None_

Prints all configured profiles.

<!-- omit in toc -->
#### Examples
```json
$ up profile view
{
    "default": {
        "id": "my-name",
        "type": "user",
        "session": "REDACTED",
        "account": "my-org",
        "base": {
            "color": "blue"
        }
    }
}
```