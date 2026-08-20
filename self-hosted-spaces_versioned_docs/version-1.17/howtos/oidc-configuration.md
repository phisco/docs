---
title: Configure OIDC
sidebar_position: 20
description: Configure OIDC in your Space
---
:::important
This guide is only applicable for administrators who've deployed self-hosted Spaces. For general RBAC in Upbound, read [Upbound RBAC][upbound-rbac].
:::

Upbound uses the Kubernetes [Structured Authentication Configuration][structured-auth-config]  to validate OIDC tokens sent to the API. Upbound stores this
configuration as a `ConfigMap` and authenticates with the Upbound router
component during installation with Helm.

This guide walks you through how to create and apply an authentication
configuration to validate Upbound with an external identity provider. Each
section focuses on a specific part of the configuration file.


## Creating the `AuthenticationConfiguration` file

First, create a file called `config.yaml` with an `AuthenticationConfiguration`
kind. The `AuthenticationConfiguration` is the initial authentication structure
necessary for Upbound to communicate with your chosen identity provider.

```yaml
apiVersion: apiserver.config.k8s.io/v1beta1
kind: AuthenticationConfiguration
jwt:
- issuer:
    url: oidc-issuer-url
    audiences:
    - oidc-client-id
  claimMappings: # optional
    username:
      claim: oidc-username-claim
      prefix: oidc-username-prefix
    groups:
      claim: oidc-groups-claim
      prefix: oidc-groups-prefix
```

<!-- vale gitlab.Uppercase = NO -->
For detailed configuration options, including the CEL-based token validation,
review the feature [documentation][structured-auth-config]. 
<!-- vale gitlab.Uppercase = YES -->

The `AuthenticationConfiguration` allows you to configure multiple JWT
authenticators as separate issuers.

### Configure an issuer

The `jwt` array requires an `issuer` specification and typically contains:

- A `username` claim mapping
- A `groups` claim mapping
Optionally, the configuration may also include:
- A set of claim validation rules
- A set of user validation rules

The `issuer` URL must be unique across all configured authenticators.

```yaml
issuer:
  url: https://example.com
  discoveryUrl: https://discovery.example.com/.well-known/openid-configuration
  certificateAuthority: |-
    <Inline CA Certificate>
  audiences:
  - client-id-a
  - client-id-b
  audienceMatchPolicy: MatchAny
```

By default, the authenticator assumes the OIDC Discovery URL is
`{issuer.url}/.well-known/openid-configuration`. Most identity providers follow
this structure, and you can omit the `discoveryUrl` field. To use a separate
discovery service, specify the full path to the discovery endpoint in this
field.

If the CA for the Issuer isn't public, provide the PEM encoded CA for the Discovery URL.

At least one of the `audiences` entries must match the `aud` claim in the JWT.
For OIDC tokens, this is the Client ID of the application attempting to access
the Upbound API. Having multiple values set allows the same configuration to
apply to multiple client applications, for example the `kubectl` CLI and an
Internal Developer Portal.

If you specify multiple `audiences` , `audienceMatchPolicy` must equal `MatchAny`.

### Configure `claimMappings`

#### Username claim mapping

By default, the authenticator uses the `sub` claim as the user name. To override this, either:

- specify *both* `claim` and `prefix`. `prefix` may be explicitly set to the empty string.
or
<!-- vale gitlab.Uppercase = NO -->
- specify a CEL `expression` to calculate the user name.
<!-- vale gitlab.Uppercase = YES -->
```yaml
claimMappings:
  username:
    claim: "sub"
    prefix: "keycloak"
    # <or>
    expression: 'claims.username + ":external-user"'
```


#### Groups claim mapping

By default, this configuration doesn't map groups, unless you either:

- specify both `claim` and `prefix`. `prefix` may be explicitly set to the empty string.
or
<!-- vale gitlab.Uppercase = NO -->
- specify a CEL `expression` that returns a string or list of strings.
<!-- vale gitlab.Uppercase = YES -->

```yaml
claimMappings:
  groups:
    claim: "groups"
    prefix: ""
    # <or>
    expression: 'claims.roles.split(",")'
```


### Validation rules

<!-- vale gitlab.Uppercase = NO -->
Validation rules are outside the scope of this document. Review the
[documentation][structured-auth-config] for more information. Examples include
using CEL expressions to validate authentication such as: 
<!-- vale gitlab.Uppercase = YES -->

- Validating that a token claim has a specific value
- Validating that a token has a limited lifetime
- Ensuring usernames and groups don't contain reserved prefixes

## Required claims

To interact with Space and ControlPlane APIs, users must have the `upbound.io/aud` claim set to one of the following:

| Upbound.io Audience                                      | Notes                                                                |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| `[]`                                                     | No Access to Space-level or ControlPlane APIs                        |
| `['upbound:spaces:api']`                                 | This Identity is only for Space-level APIs                  |
| `['upbound:spaces:controlplanes']`                       | This Identity is only for ControlPlane APIs                 |
| `['upbound:spaces:api', 'upbound:spaces:controlplanes']` | This Identity is for both Space-level and ControlPlane APIs |


You can set this claim in two ways:

- In the identity provider mapped in the ID token.
- Inject in the authenticator with the `jwt.claimMappings.extra` array.

For example:
```yaml
apiVersion: apiserver.config.k8s.io/v1beta1
kind: AuthenticationConfiguration
jwt:
- issuer:
    url: https://keycloak:8443/realms/master
    certificateAuthority: |-
      <ca bytes inline>
    audiences:
    - master-realm
    audienceMatchPolicy: MatchAny
  claimMappings:
    username:
      claim: "preferred_username"
      prefix: "keycloak:"
    groups:
      claim: "groups"
      prefix: ""
    extra:
    - key: 'upbound.io/aud'
      valueExpression: "['upbound:spaces:controlplanes', 'upbound:spaces:api']"
```

## Install the `AuthenticationConfiguration`

Once you create an `AuthenticationConfiguration` file, specify this file as a
`ConfigMap` in the host cluster for the Upbound Space.

```sh
kubectl create configmap <configmap name> -n upbound-system --from-file=config.yaml=./path/to/config.yaml
```
<!-- vale gitlab.SentenceLength = NO -->
<!-- vale Google.WordList = NO -->
To enable OIDC authentication and disable Upbound IAM when installing the Space,
reference the configuration and pass an empty value to the Upbound IAM issuer
parameter:
<!-- vale Google.WordList = YES -->
<!-- vale gitlab.SentenceLength = YES -->
```sh
up space init --token-file="${SPACES_TOKEN_PATH}" "v${SPACES_VERSION}" \
  ...
  --set "authentication.structuredConfig=<configmap name>" \
  --set "router.controlPlane.extraArgs[0]=--upbound-iam-issuer-url="
```
<!-- vale Microsoft.HeadingAcronyms = NO -->
## Configure RBAC
<!-- vale Microsoft.HeadingAcronyms = YES -->

In this scenario, the external identity provider handles authentication, but
permissions for Spaces and ControlPlane APIs use standard RBAC objects.

### Spaces APIs

The Spaces APIs include:
```yaml
- apiGroups:
  - spaces.upbound.io
  resources:
  - controlplanes
  - sharedexternalsecrets
  - sharedsecretstores
  - backups
  - backupschedules
  - sharedbackups
  - sharedbackupconfigs
  - sharedbackupschedules
- apiGroups:
  - observability.spaces.upbound.io
  resources:
  - sharedtelemetryconfigs
```
<!-- vale Google.Headings = NO -->
### ControlPlane APIs
<!-- vale Google.Headings = YES -->

<!-- vale Google.WordList = NO -->
Crossplane specifies three [roles][crossplane-managed-clusterroles] for a
ControlPlane: admin, editor, and viewer. These map to the verbs `admin`, `edit`,
and `view` on the `controlplanes/k8s` resource in the `spaces.upbound.io` API
group.
<!-- vale Google.WordList = YES -->

### Control access

The `groups` claim in the `AuthenticationConfiguration` allows you to control
resource access when you create a `ClusterRoleBinding`. A `ClusterRole` defines
the role parameters and a `ClusterRoleBinding` subject.

The example below allows `admin` permissions for all ControlPlanes to members of
the `ctp-admins` group:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: allow-ctp-admin
rules:
- apiGroups:
  - spaces.upbound.io
  resources:
  - controlplanes/k8s
  verbs:
  - admin
```

ctp-admins ClusterRoleBinding
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: allow-ctp-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: allow-ctp-admin
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: ctp-admins
```

[structured-auth-config]: https://kubernetes.io/docs/reference/access-authn-authz/authentication/#using-authentication-configuration
[crossplane-managed-clusterroles]: https://github.com/crossplane/crossplane/blob/master/design/design-doc-rbac-manager.md#managed-rbac-clusterroles
[upbound-rbac]: /manuals/platform/rbac
