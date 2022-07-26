---
title: "↳ MySQL"
metaTitle: "MySQL"
metaDescription: "Connecting to MySQL"
rank: 55
---

Upbound Enterprise includes a few components that utilize MySQL.

By default, the Upbound Enterprise Chart includes an in-cluster MySQL deployment 
that is provided by `helm/mysql`. This is for trial/demo purposes only and not 
recommended for use in production.

It’s strongly recommended to set up an external production-ready MySQL instance. 

In order to connect to an external MySQL instance, specify 
`--set mysql.enabled=false` during installation and create a secret that looks 
like the following in the namespace that Upbound Enterprise is being installed 
into:

```yaml
apiVersion: v1
kind: Secret
type: Opaque
metadata:
  name: api-mysql-conn
  namespace: upbound-enterprise
stringData:
  cloud_db_connection: db-user:db-password@tcp(db-host:3306)/db_name 
```

If you would prefer to name your connection `Secret` differently, you can do so 
by specifying `--set global.secretRefs.mysqlConn={your provided name}` during 
installation and setting your `Secret`'s name to the provided name.

If you would prefer to name your DB something other than `db_name`, you can do 
so by specifying `--set mysql.mysqlDatabase={your provided name}` during 
installation and specifying the DB name at the end of connection string in your 
`Secret`.

In addition to the above, your external MySQL instance will need to be configured 
to allow the your DB user to:
- create tables within the MySQL instance
- read from the tables
- write to those tables