---
title: "↳ Certificates"
metaTitle: "Certificates"
metaDescription: "Setting Up Certificates"
rank: 52
---

### Cert Manager
Upbound Enterprise requires the use of a number of certificates for securing 
communication between its components. In order to make certificate issuance 
less of a burden, Upbound Enterprise comes with various `Certificate` resource 
definitions that work with [`cert-manager`] deployments.

The use of the built in `Certificate` resources assumes that you currently 
operate `cert-manager` within your environment.

In the event you do not currently use `cert-manager` within your environment, 
you can disable these resources by specifying `--set haveCertManager=false` 
during installation of Upbound Enterprise. Doing so will tell the installation 
to instead generate the necessary certificates using Helm.

### Gateway TLS Certificate
Upbound Enterprise's components are externally served using TLS; however, 
given the variety of ways customer's choose to manage TLS within their 
environments, Upbound Enterprise does not provide TLS certs to enable that 
communication.

In order to satisfy the TLS termination requirement, you will need to create a 
secret that describes your TLS settings. 

Below is an example secret:
```yaml
apiVersion: v1
kind: Secret
type: kubernetes.io/tls
metadata:
  name: ingress-tls
  namespace: upbound-enterprise
data:
  tls.crt: "${INGRESS_TLS_CERT}"
  tls.key: "${INGRESS_TLS_KEY}"
```

Where `${INGRESS_TLS_CERT}` is the base64 encoded string containing your TLS 
certificate and `${INGRESS_TLS_KEY}` is the base64 encoded string containing 
your TLS key.

The notable item:
`name`: if you want to name this secret something else, you will need to specify 
`--set secrets.ingressTLS={{secret name}}` during installation of Upbound 
Enterprise. The default is `ingress-tls`

For more details on how ingress is configured for Upbound Enteprise, checkout
the [ingress] docs.

<!-- Links -->
[`cert-manager`]: https://cert-manager.io/docs/
[ingress]: ../ingress