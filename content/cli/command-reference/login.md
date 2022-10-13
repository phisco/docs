---
title: "up login"
---

Authenticates to the Upbound Marketplace.

### `up login`

<!-- omit in toc -->
#### Arguments
* `-u,--username = <username>` - the username to authenticate. Defaults to the value of the environmental variable `UP_USER`
* `-p, --password = <password>` - the password to authenticate. Defaults to the value of the environmental variable `UP_PASS`
* `-t, --token = <token value>` - an Upbound `user token` to use in place of a username and password
* `-a, --account = <organization>` - authenticate as a member of an organization.

Authenticates to Upbound and generates and locally stores a JSON credentials file in `~/.up/config.json`. 
Commands requiring authentication to Upbound services use the JSON file to authenticate.

If run without arguments `up login` asks for the username and password from the terminal.

View the current authentication status with `up organization list`.


#### Examples

##### Login without arguments
```shell
up login
Username: my-name
Password:
my-name logged in
```
{{<hint type="tip" >}}
The password isn't echoed to the terminal.
{{< /hint >}}

#### Login with a token
Use an Upbound `user token` to authenticate in place of a username and password. 

```shell
up login -t eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyYWY2NmFjMi1iY2NhLTRkOWUtODRjNy1kZDJhOTFlNzNjODEiLCJzdWIiOiJ1c2VyfDE0NjMifQ.EEk1Ukei$fkhKKx2yQKeq0pIs3dnjkbOvvjD22_osdKXntGE39G8CsrORO0XT7w300Apw1HW8f21GyGAeO0ilxW6B8efKAqILd0V4-9eAL-VnCK6iLU6wHVt_vP6JwRLyEJrnn7ldYbaz1i4LONZhd5UfsRe4bOztnohkWNsUeIEOnRj_PBntGA5o1VQEyv4kwOS5vp5aVNF9zYWyW7RFKjpmgPdDqLQ_SSKrqmUQPXW4X886lfNWsgtdcTthoo3NEiKPDfrpSh1ZW-4jurGvrgdhfOO2kMRkk-5lZQ0usPYZ62gqTnayjxYP4TCKA7HCKhjoZlX5MS2WlObeTIgA
2af6a653-abcd-4d9e-84c7-dd3a91e73c81 logged in
```

#### Login to an organization
Log into an organization with either a username and password or token. 

{{< hint type="tip" >}}
To determine if you are part of any organizations or to create an organization use the [`up organization` commands]({{<ref "http://localhost:1313/cli/command-reference/organization">}}).
{{< /hint >}}

```shell
up login -a my_org
Username: my-name
Password:
my-name logged in
```

#### Verify login status
Verify the state of `login` with `up organization list`.

When logged in the list of organizations the user belongs to.

```shell
up organization list
NAME           ROLE
my_org        owner
```

If not logged in, the command returns an error.
```shell
up org list
up: error: permission denied: {"message":"Unauthorized"}
```