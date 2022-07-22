---
title: "↳  Globals"
metaTitle: "Globals"
metaDescription: "Configure Charts using Globals"
rank: 53
---

To reduce configuration duplication when installing the `Enterprise` Helm chart, 
several configuration settings are available to be set in the global section of 
`values.yaml`. These global settings are used across a number of the charts, 
while all other settings are scoped within their chart. See the 
[Helm documentation on globals] for more information on how the global variables 
work.

- [Host]
- [Allowed Registration Domains]
- [Image Pull Secret]
- [Logging]
- [Secret References]


### Configure Host Settings
The Upbound Enterprise global host settings are located under the `global.hosts key`.
```yaml
global:
  hosts:
    domain: acme.com
```
|Name|Type|Default|Description|
|----|----|-------|-----------|
|`domain`|String|`local.upbound.io`|The base domain. The other components deployed as part of `Enterprise` are deployed as subdomains of this base domain.|

### Configure Allowed Registration Domains
The Upbound Enterprise email domains that are allowed to be used for 
registration are configured under `globals.registerEmailDomains`.

```yaml
global:
  registerEmailDomains:
    - "upbound.io"
```

### Configure Image Pull Secret Settings
The Upbound Enterprise global image pull secret settings are located under the 
`global.imagePullSecrets` key.

```yaml
global:
  imagePullSecrets:
    - enterprise-pull-secret
```
|Name|Type|Default|Description|
|----|----|-------|-----------|
|`imagePullSecrets`|Array|`enterprise-pull-secret`|The Kubernetes `Secret` that 
holds the credentials for image pulling.|

### Configure Logging Settings
The Upbound Enterprise global logging settings are located under the 
`global.logging` key.

```yaml
global:
  logging:
    debug: false
```
|Name|Type|Default|Description|
|----|----|-------|-----------|
|`debug`|Boolean|`false`|Toggles debug logging for components deployed with `Enterprise`.|

### Configure Secret Reference Settings
The Upbound Enterprise global secret reference settings are located under the 
`global.secretRefs` key.

```yaml
global:
  secretRefs:
    ingressTLS: ingress-tls
    mysqlConn: api-mysql-conn
    redisConn: api-redis-conn
    smtpConn: api-smtp-conn
```
|Name|Type|Default|Description|
|----|----|-------|-----------|
|`ingressTLS`|String|`ingress-tls`|Defines the Kubernetes `Secret` that holds 
the TLS certificates for the provided `Ingress`.|
|`mysqlConn`|String|`api-mysql-conn`|Defines the Kubernetes `Secret` that holds the connection string details for the MySQL instance the deployment connects to.|
|`redisConn`|String|`api-redis-conn`|Defines the Kubernetes `Secret` that holds the connection details for the Redis instance the deployment connects to.|
|`smtpConn`|String|`api-smtp-conn`|Defines the Kubernetes `Secret` that holds the connection details for the SMTP instance the deployment connects to.|

<!-- Links -->
[Helm documentation on globals]: https://helm.sh/docs/chart_template_guide/subcharts_and_globals/#global-chart-values
[Host]: #configure-host-settings
[Allowed Registration Domains]: #configure-allowed-registration-domains
[Image Pull Secret]: #configure-image-pull-secret-settings
[Logging]: #configure-logging-settings
[Secret References]: #configure-secret-references-settings