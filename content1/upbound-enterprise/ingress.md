---
title: "↳ Ingress"
metaTitle: "Ingress"
metaDescription: "Setting Up Ingress"
rank: 54
---

Upbound Enterprise comes with an `Ingress` definition that enables external 
traffic to hit the various components that make up its deployment. The 
`Ingress` definition itself works well with the common `ingress-nginx` 
[controller].

#### Notes
1: Upbound Enterprise does not bundle an `ingress-controller` as part of 
installation.

2: If you do use `ingress-nginx` please see our [section] at the bottom
of this page discussing mitigation steps for a recently discovered
CVE in `ingress-nginx`.

#### Using A Different Ingress Controller

If you prefer to not use `ingress-nginx` as your `Ingress` resource, for 
example you use a different type of ingress provider (different controller, 
you use a service mesh, etc), you can disable the installation of the `Ingress` 
resource by specifying `--set ingress.enabled=false` during the installation of 
Upbound Enterprise. The default is `true`.

If you do disable installation, in order to access Upbound Enterprise from 
outside of your cluster, the following comparable definitions will need to be 
configured in your `Ingress`:

```yaml
  - host: api.{{ .Values.global.hosts.domain }}
    http:
      paths:
        - path: "/svc/auth-api/(ready|up.json)"
          pathType: Prefix
          backend:
            service:
              name: api-auth
              port:
                name: public
        - path: "/v1/(login|logout|nats|gw)(/.*)?"
          pathType: Prefix
          backend:
            service:
              name: api-auth
              port:
                name: public
        - path: "/svc/core-api/(ready|up.json)"
          pathType: Prefix
          backend:
            service:
              name: api-core
              port:
                name: public
        - path: "/v(1|2)/(register|self|organizations|teams|validate|controlPlanes|accounts|tokens|users|robots|loginProviders)(/.*)?"
          pathType: Prefix
          backend:
            service:
              name: api-core
              port:
                name: public
        - path: "/graphql"
          pathType: Prefix
          backend:
            service:
              name: upbound-graphql
              port:
                name: http
  - host: proxy.{{ .Values.global.hosts.domain }}
    http:
      paths:
        - path: "/"
          pathType: Prefix
          backend:
            service:
              name: crossplane-router
              port:
                name: router
  - host: static.{{ .Values.global.hosts.domain }}
    http:
      paths:
        - path: "/"
          pathType: Prefix
          backend:
            service:
              name: frontend
              port:
                name: http
  - host: upbound.{{ .Values.global.hosts.domain }}
    http:
      paths:
        - path: "/"
          pathType: Prefix
          backend:
            service:
              name: frontend
              port:
                name: http
```

`.Values.global.hosts.domain` maps to the `--set global.hosts.domain={{domain
name}}` setting you specified during installation of Upbound Enterprise.

#### CVE In ingress-nginx

Please note that if you are using [`ingress-nginx`], there is a known
vulnerability that allows a user that can create or update ingress objects
the ability to obtain all secrets within the cluster. See the [issue description]
to determine if your environments are currently susceptible and steps to take
to mitigate this vulnerability.

<!-- Links -->
[controller]: https://kubernetes.github.io/ingress-nginx/
[`ingress-nginx`]: https://kubernetes.github.io/ingress-nginx/
[issue description]: https://github.com/kubernetes/ingress-nginx/issues/7837#issue-1032675879
[section]: #cve-in-ingress-nginx