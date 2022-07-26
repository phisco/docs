---
title: "Install"
metaTitle: "Install"
metaDescription: "Installing Upbound Enterprise"
rank: 51
---

# Before You Begin

Whether you are attempting to install the Upbound Enterprise demo or working 
towards a production deployment, you will need the following items in order to 
proceed:

* Acquire `License ID` and `Token`. If you haven't done so already, reach out to
  your sales representative to get setup with your `License ID` and `Token`.
  Once you have those in hand, feel free to proceed to the next prerequisite.
* Install `up`. If you haven't done so already, make sure to [install up].

Below we cover two different installation paths:
* [Quick Start Installation] is meant to get you up and running quickly so you 
can see what `Upbound` looks like to run in a minimal environment that is not 
intended for production use.
* [Production Installation] is meant to help guide you through installing 
`Upbound` into your production environment.

# Quick Start Installation

The following steps will walk you through quickly setting up a demo install of 
Upbound.

⚠ **The demo install is not a recommended installation for `Production` 
deployments. Please see the [Production Installation] docs for more detailed 
instructions.** ⚠ 

#### Install

For our demo install, we'll be using the following extra piece to make getting
up and running smoother.

* `kind`. See the [kind install] docs for recommended steps on acquiring `kind`.

1. Start your `Kind` cluster

```bash
# We'll pipe the following kind config to the `kind create cluster` command in 
# order to allow inbound requests to the cluster.

cat <<EOF | kind create cluster --config -
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    image: kindest/node:v1.22.1
    kubeadmConfigPatches:
      - |
        kind: InitConfiguration
        nodeRegistration:
          kubeletExtraArgs:
            node-labels: "ingress-ready=true"
    extraPortMappings:
      - containerPort: 80
        hostPort: 80
        protocol: TCP
      - containerPort: 443
        hostPort: 443
        protocol: TCP
      - containerPort: 31000
        hostPort: 4222
EOF
```
2. Add `cert-manager` to your new `kind` cluster

```bash
# We'll use Helm to install cert-manager for these steps.
# Add the jetstack repo it doesn't yet exist.

helm repo add jetstack https://charts.jetstack.io

# Update the repo

helm repo update

# Add the cert-manager CRDs

kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.3.1/cert-manager.crds.yaml

# Create cert-manager namespace

kubectl create ns cert-manager

# Install cert-manager

helm install cert-manager jetstack/cert-manager \
    --namespace cert-manager \
    --version v1.3.1
```

3. Add `nginx-ingress-controller` to your new `kind` cluster

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.0.0/deploy/static/provider/kind/deploy.yaml

# wait until the new Ingress controller is ready

kubectl wait --namespace ingress-nginx \
      --for=condition=ready pod \
      --selector=app.kubernetes.io/component=controller \
      --timeout=90s
```
4. Create namespace to deploy `Upbound` into

```bash
kubectl create ns upbound-enterprise
```
5. Create TLS secret for securing inbound requests to `Upbound`

```bash
# 1. You'll need to create a self signed certificate with CN = local.upbound.io. 
#    Below are some steps to get you a CA certificate, key, and leaf certificate.

# setup an openssl.cnf file so that we can set alt_names
cat > "openssl.cnf" << EOF
[req]
default_bits = 2048
encrypt_key  = no
default_md   = sha256
prompt       = no
utf8         = yes

distinguished_name = req_distinguished_name
req_extensions = v3_req

[req_distinguished_name]
CN = local.upbound.io

[v3_req]
basicConstraints     = CA:FALSE
subjectKeyIdentifier = hash
keyUsage             = digitalSignature, keyEncipherment
extendedKeyUsage     = clientAuth, serverAuth
subjectAltName       = @alt_names

[alt_names]
DNS.1 = local.upbound.io
DNS.2 = *.local.upbound.io
EOF

# create the CA (certificate authority)
openssl req \
  -new \
  -newkey rsa:2048 \
  -days 3650 \
  -nodes \
  -x509 \
  -subj "/CN=local.upbound.io" \
  -keyout "ca.key" \
  -out "ca.crt"

# generate the private key for the service
openssl genrsa -out "tls.key" 2048

# generate the CSR (certificate signing request) using the above configuration 
# and key we generated in the previous step
openssl req \
  -new -key "tls.key" \
  -out "tls.csr" \
  -config "openssl.cnf"

# sign the CSR with the CA
openssl x509 \
  -req \
  -days 3650 \
  -in "tls.csr" \
  -CA "ca.crt" \
  -CAkey "ca.key" \
  -CAcreateserial \
  -extensions v3_req \
  -extfile "openssl.cnf" \
  -out "tls.crt"

# (optional) verify the certificate
openssl x509 -in "tls.crt" -noout -text

# 2. Once you have your self signed certificates in hand run the following to 
#    set your environment variables for the next step.
INGRESS_TLS_CERT=$(openssl base64 -A -in tls.crt)
INGRESS_TLS_KEY=$(openssl base64 -A -in tls.key)
# 3. Run the following command with ${INGRESS_TLS_CERT} and ${INGRESS_TLS_KEY} 
#    replaced with the output of the above variables

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
type: kubernetes.io/tls
metadata:
  name: ingress-tls
  namespace: upbound-enterprise
data:
  tls.crt: "${INGRESS_TLS_CERT}"
  tls.key: "${INGRESS_TLS_KEY}"
EOF
```

6. Add certificates to your trust store

With your certificates created in step 5 (`ca.crt` and `tls.crt`), you'll want
to add the certificates to your operating system's trust store. This step will
enable you to access the Upbound dashboard in your browser.

Below are some ways to add the certificates to your trust store:

#### Mac OS X

```bash
# add self-signed root cert to trust store
sudo security add-trusted-cert -d -r trustRoot -p ssl -k "/Library/Keychains/System.keychain" "ca.crt"
# add intermediate/leaf cert to trust store
sudo security add-trusted-cert -d -r trustAsRoot -p ssl -k "/Library/Keychains/System.keychain" "tls.crt"
```

#### Linux (Ubuntu)

```bash
# add self signed root cert to ca-certs
sudo cp ca.crt /usr/local/share/ca-certificates/ca.crt
# add intermediate/lead cert to ca-certs
sudo cp tls.crt /usr/local/share/ca-certificates/tls.crt
# pick up the changes
sudo update-ca-certificates
```

7. Add entries to your `/etc/hosts` file for accessing deployment from localhost

```bash
# The Upbound instance will be available at upbound.local.upbound.io for the demo

127.0.0.1       upbound.local.upbound.io connect.local.upbound.io static.local.upbound.io api.local.upbound.io proxy.local.upbound.io
```

8. Setup your `enterprise-values.yaml`

In this step, you'll be setting up your `enterprise-values.yaml` file. This file
is analogous to a `Helm` values.yaml which we will use to set multiple values at
once versus supplying multiple `--set` commands.

Of the values below, for the purpose of the demo you can leave most of them as
is. However you will **_need_** to change the SMTP values.

Specifically, you will need to fill in the `server`, `port`, `user`, `password`,
and `from` details.

**Tip**: if you want to use your Gmail account, you will most likely need to
setup an app password for Gmail. There's a great walkthrough on how to do this
on [lifewire].

In addition, you will also need to specify the domain(s) you want to allow
your users to register under. That setting is configured using the 
`global.registerEmailDomains` array.

```bash
cat > enterprise-values.yaml <<EOF
global:
  registerEmailDomains:
    - "acme.com"

mysql:
  mysqlUser: upbound
  mysqlPassword: upbound

redis:
  auth:
    password: supersecret

smtp:
  enabled: true
  server: example.com
  port: 1234
  user: test
  password: supersecret
  from: test@example.com
EOF
```

#### Next Steps

At this point you can proceed to [install enterprise using up].

# Production Installation

#### Kubernetes Versions

Upbound Enterprise has been tested to install successfully across the following 
versions of Kubernetes, which align with the versions currently supported by the 
main cloud providers:

- v1.22.1
- v1.21.2
- v1.20.7
- v1.19.11
- v1.18.15
- v1.17.17
- v1.16.15

#### Prerequisites

For production deployments, in order to set up your installation effectively, 
please be sure to go through each of the linked sections below.

|Topic|Description|
|---|---|
|[Certificates]|Installations of Upbound Enterprise require certificate infrastructure to be in place.|
|[Ingress]|In order to access the Upbound dashboard, an `Ingress` configuration will need to be in place.|
|[MySQL]|Multiple Upbound components utilize MySQL for persistence.|
|[Redis]|Multiple Upbound components utilize Redis for object storage.|
|[SMTP]|Upbound Enterprise requires access to an SMTP server in order enable user registration.|

In addtion to the above items, there are some common global settings that apply 
to multiple components. See the [Globals Documentation] for details on the 
various global configurations.

#### Next Steps

Assuming you have added the configuration adjustments specific to your environment 
in a file named `enterprise-values.yaml`, you can move on to [install using up] 
below.

# Install Using `up`

Using the `enterprise-values.yaml` from the previous step, you're now ready to
install the Upbound components.

```bash
up enterprise install v1.1.0 -f enterprise-values.yaml
```

# Verifying Your Installation
Assuming you installed Upbound Enterprise into the `upbound-enterprise` namespace, 
you can use the following command to quickly verify the health of your installation: 

```bash
kubectl -n upbound-enterprise get pods -w

# If everything is healthy your install should look similar to this

NAME                                            READY   STATUS           RESTARTS   AGE
api-auth-enterprise-68696645b5-z4qbq            1/1     Running          0          2m
api-core-enterprise-5d68cf8986-hsppf            1/1     Running          0          2m
api-mysql-76495c7ff6-n2bsv                      1/1     Running          0          2m
api-private-auth-enterprise-5cf7b4585b-6b9w6    1/1     Running          0          2m
api-private-enterprise-5fd57bd6df-kdzbr         1/1     Running          0          2m
crossplane-router-enterprise-549965577b-6rmwx   1/1     Running          0          2m
frontend-enterprise-589849698b-b75w2            1/1     Running          0          2m
nats-0                                          3/3     Running          0          2m
nats-monitoring-6995775789-4mm4h                1/1     Running          0          2m
nsc-setup-kqc42                                 1/1     Completed        0          2m
redis-master-0                                  1/1     Running          0          2m
upbound-graphql-enterprise-5b9ccdb45b-jchlw     1/1     Running          0          2m
```

# Visit Upbound Enterprise

If you followed the `Quick Start Installation` guide, you should now be able to 
visit `https://upbound.local.upbound.io` in your browser of choice.

If however, you have performed a `Production` installation of
`Upbound Enteprise`, you should now be able to visit Upbound Enterprise
at the domain you setup in your browser of choice.

# Next Steps

Now that you have installed Upbound, you can move on to [create your account].

<!-- Links -->
[certificates]: ../certificates
[cert-manager install]: https://cert-manager.io/docs/installation/
[create your account]: ../../getting-started/create-account
[Globals Documentation]: ../globals
[ingress]: ../ingress
[install up]: ../../cli
[install enterprise using up]: #install-using-up
[install using up]: #install-using-up
[kind install]: https://kind.sigs.k8s.io/docs/user/quick-start/#installation
[lifewire]: https://www.lifewire.com/get-a-password-to-access-gmail-by-pop-imap-2-1171882
[mysql]: ../mysql
[nginx-ingress-controller]: https://kubernetes.github.io/ingress-nginx/deploy/
[Quick Start Installation]: #quick-start-installation
[Production Installation]: #production-installation
[redis]: ../redis
[smtp]: ../smtp