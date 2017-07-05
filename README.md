<a href="https://github.com/djenriquez/vault-ui">
    <img src="http://svgshare.com/i/177.svg" alt="Vault-UI Logo"
         title="Vault-UI" width="64px" align="right" />
</a>

[![](https://images.microbadger.com/badges/image/djenriquez/vault-ui.svg)](https://microbadger.com/images/djenriquez/vault-ui)
[![Run Status](https://api.shippable.com/projects/581e7826fbc68c0f00deb0ca/badge?branch=master)](https://app.shippable.com/projects/581e7826fbc68c0f00deb0ca)

# Vault-UI

A beautiful way to manage your Hashicorp Vault

![](http://i.imgur.com/COBxk3m.gif)

## Features

- Easy to deploy as Web App
- Desktop version works on Mac, Linux and Windows
- Material UI Design
- Integrated JSON Editor
- Written in React

## Installation

### Desktop Version

Vault-UI Desktop is available for the following operating systems:
- Windows
- MacOS
- Linux (32bit and 64bit AppImage)

Download the latest version from the release page and install/run the software

### Web Version

Vault-UI can be deployed as a shared web app for your organization

Docker images are automatically built using an [automated build on Docker Hub](https://hub.docker.com/r/djenriquez/vault-ui/builds/).
We encourage that versioned images are used for production.

To run Vault-UI using the latest Docker image:
```bash
docker run -d \
-p 8000:8000 \
--name vault-ui \
djenriquez/vault-ui
```

#### Advanced configuration options

By default, connection and authentication parameters must be configured by clicking on the configuration cog on the login page.
Using environment variables (via docker), an administrator can pre-configure those parameters.

Example command to pre-configure the Vault server URL and authentication method
```bash
docker run -d \
-p 8000:8000 \
-e VAULT_URL_DEFAULT=http://vault.server.org:8200 \
-e VAULT_AUTH_DEFAULT=GITHUB \
--name vault-ui \
djenriquez/vault-ui
```

Supported environment variables:
- `CUSTOM_CA_CERT` Pass a self-signed certificate that the system should trust
- `NODE_TLS_REJECT_UNAUTHORIZED` disable TLS server side validation (ex. vault deployed with self-signed certificate)
- `VAULT_URL_DEFAULT` will set the default vault endpoint.
- `VAULT_AUTH_DEFAULT` will set the default authentication method type. See below for supported authentication methods.
- `VAULT_AUTH_BACKEND_PATH` will set the default backend path. Useful when multiple backends of the same type are mounted on the vault file system.
- `VAULT_SUPPLIED_TOKEN_HEADER` will instruct Vault-UI to attempt authentication using a token provided by the client in the specified HTTP request header.

This defaults can be overridden if the user fills out the endpoint and auth method manually.


Current supported login methods:
- `GITHUB` : When using the [GitHub](https://www.vaultproject.io/docs/auth/github.html) backend
- `USERNAMEPASSWORD` : When using the [Username & Password](https://www.vaultproject.io/docs/auth/userpass.html) or [RADIUS](https://www.vaultproject.io/docs/auth/radius.html) backends
- `LDAP` : When using the [LDAP](https://www.vaultproject.io/docs/auth/ldap.html) backend
- `TOKEN` : When using the [Tokens](https://www.vaultproject.io/docs/auth/token.html) backend

Current supported management of backend auth methods:
- [GitHub](https://www.vaultproject.io/docs/auth/github.html)
- [RADIUS](https://www.vaultproject.io/docs/auth/radius.html)
- [AWS-EC2](https://www.vaultproject.io/docs/auth/aws-ec2.html)
- [Username & Password](https://www.vaultproject.io/docs/auth/userpass.html)
- [Token](https://www.vaultproject.io/docs/auth/token.html)

In some cases, users might want to use middleware to authenticate into Vault-UI for purposes like SSO. In this case, the `VAULT_SUPPLIED_TOKEN_HEADER` may be populated with the name of the header that contains a token to be used for authentication.


## Usage

### Basic policy for Vault-UI users
A user/token accessing Vault-UI requires a basic set of capabilities in order to correctly discover and display the various mounted backends.
Please make sure your user is granted a policy with at least the following permissions:

#### JSON
```json
{
  "path": {
    "auth/token/lookup-self": {
      "capabilities": [
        "read"
      ]
    },
    "sys/capabilities-self": {
      "capabilities": [
        "update"
      ]
    },
    "sys/mounts": {
      "capabilities": [
        "read"
      ]
    },
    "sys/auth": {
      "capabilities": [
        "read"
      ]
    }
  }
}
```

#### HCL
```
path "auth/token/lookup-self" {
    capabilities = [ "read" ]
}

path "sys/capabilities-self" {
    capabilities = [ "update" ]
}

path "sys/mounts" {
    capabilities = [ "read" ]
}

path "sys/auth" {
    capabilities = [ "read" ]
}
```

### Secrets
Secrets are now managed using the graphical [josdejong/jsoneditor](https://github.com/josdejong/jsoneditor) JSON editor. Schema validation is enforced on policies to aid the operator in writing correct syntax.

Secrets also are accessible directly by key from a browser by navigating to the URI `/secrets/<backendtype>/<mountpoint>/key`. For example, if you have a generic secret key of /hello/world/vault using the _generic_ mount `secret/`, one can navigate to this directly through http://vault-ui.myorg.com/secrets/secret/hello/world/vault.

#### Root key bias
By default, secrets will display as their raw JSON value represented by the `data` field in the HTTP GET response metadata. However, users can apply a "Root Key" bias to the secrets through the settings page. The "Root Key" will be used when reading, creating and updating secrets such that the value displayed in the UI is the value stored at the "Root Key". For example, if the secret at `secret/hello` is `{ "value": "world" }`, setting the "Root Key" to `value` will update the UI such that the secret will display as simply "world" instead of `{ "value": "world" }`.


### Policies
Policies are managed also using the [josdejong/jsoneditor](https://github.com/josdejong/jsoneditor) JSON editor. Currently, GitHub and raw Tokens are the only supported authentication backends for associated policies.

### Token Management
Users have the ability to create and revoke tokens, manage token roles and list accessors. The following permissions are needed at minimum for this feature:

#### JSON:
```json
{
  "path": {
     "auth/token/accessors": {
       "capabilities": [
         "sudo",
         "list"
       ]
    },
     "auth/token/lookup-accessor/*": {
       "capabilities": [
         "read"
       ]
    }
  }
}
```
#### HCL
```hcl
path "auth/token/accessors" {
    capabilities = [ "sudo", "list" ]
}

path "auth/token/lookup-accessor/*" {
    capabilities = [ "read" ]
}
```

### Response Wrapping
Vault-UI supports response-wrapping of secrets in _generic_ backends. Wrapping custom JSON data is also supported.


## Development
Install the [yarn](https://yarnpkg.com/en/docs/install) package manager

### With Docker
The command below will use [Docker Compose](https://docs.docker.com/compose/)
to spin up a Vault dev server and a Vault UI server that you can log
into with username "test" and password "test":
```sh
./run-docker-compose-dev
```

If major changes are made, be sure to run `docker-compose build` to rebuild dependencies.

### Without Docker
The following will spin up a Vault UI server only. It will not set up
Vault for you:
```sh
yarn run dev-pack &
yarn start
```

# Licensing
Vault-UI is licensed under BSD 2-Clause. See [LICENSE](https://github.com/djenriquez/vault-ui/blob/master/LICENSE) for the full license text.
