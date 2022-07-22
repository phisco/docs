---
title: "↳ Redis"
metaTitle: "Redis"
metaDescription: "Connecting to Redis"
rank: 56
---

Upbound Enterprise includes a few components that utilize Redis.

By default, the Upbound Enterprise Chart includes an in-cluster Redis deployment 
that is provided by `bitnami/Redis`. This is for trial/demo purposes only and 
not recommended for use in production.

It’s strongly recommended to set up an external production-ready Redis instance. 

In order to connect to an external Redis instance, specify 
`--set redis.enabled=false` during installation and create a secret that looks 
like the following in the namespace that Upbound Enterprise is being installed 
into:

```yaml
apiVersion: v1
kind: Secret
type: Opaque
metadata:
  name: api-redis-conn
  namespace: upbound-enterprise
stringData:
  redis_host_address: redis-master:6379
  redis_password: super-secret-password
```

If you would prefer to name your connection `Secret` differently, you can do so 
by specifying `--set global.secretRefs.redisConn={your provided name}` during 
installation and setting your `Secret`'s name to the provided name.
