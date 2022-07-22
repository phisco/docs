---
title: "↳ SMTP"
metaTitle: "SMTP"
metaDescription: "Connecting to SMTP Server"
rank: 56
---

In order to enable user registration, you will need to configure a secret that 
describes your SMTP settings within your environment.

Below is an example secret:
```yaml
apiVersion: v1
kind: Secret
type: Opaque
metadata:
  name: api-smtp-conn
  namespace: upbound-enterprise
stringData:
  server: "mail.example.com"
  port: "25"
  user: "user@mail.example.com"
  pass: "pass"
  from: "test@mail.example.com"
```

The notable items are:

|Name|Details|Default|
|----|-----------|-------|
|`name`|if you want to name this secret something else, you will need to specify `--set secrets.smtpConn={{secret name}}` during installation of Upbound Enterprise|`api-smtp-conn`|
|`server`|required field|""|
|`port`|required field|""|
|`user`|required field|""|
|`pass`|required field|""|
|`from`|optional and defines what the `FROM` address should be where the emails are coming from|""|