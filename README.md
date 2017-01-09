# Vault-UI
[![](https://images.microbadger.com/badges/image/djenriquez/vault-ui.svg)](https://microbadger.com/images/djenriquez/vault-ui)
[![Run Status](https://api.shippable.com/projects/581e7826fbc68c0f00deb0ca/badge?branch=master)](https://app.shippable.com/projects/581e7826fbc68c0f00deb0ca)

A beautiful way to manage your secrets in Vault
![Landing Page](https://github.com/djenriquez/vault-ui/raw/master/images/Landing.jpg)

![Secrets Management](https://github.com/djenriquez/vault-ui/raw/master/images/Secrets.png)
![New Secrets](https://github.com/djenriquez/vault-ui/raw/master/images/NewSecret.png)

## Configuration
Configuration is accessed by clicking on the configuration cog on the login page.
![Configuration](https://github.com/djenriquez/vault-ui/raw/master/images/Config.png)
### Vault Endpoint
Users can enter in the full endpoint to Vault, including scheme.  When running the docker image, it is possible to
set the environment variables `VAULT_URL_DEFAULT` and `VAULT_AUTH_DEFAULT`.
`VAULT_URL_DEFAULT` will set the default endpoint for users without needing them to enter one in the UI.
`VAULT_AUTH_DEFAULT` will set the default authentication method type. Supported values are: GITHUB, TOKEN, LDAP, USERNAMEPASSWORD
This defaults can be overridden if the user fills out the endpoint and auth method manually.

## Authentication
Currently supported authentication backends:
- [GitHub](https://www.vaultproject.io/docs/auth/github.html)
- [Username & Password](https://www.vaultproject.io/docs/auth/userpass.html)
- [LDAP](https://www.vaultproject.io/docs/auth/ldap.html)
- [Tokens](https://www.vaultproject.io/docs/auth/token.html)

## Secrets
By default, secrets will display as their raw JSON value represented by the `data` field in the HTTP GET response metadata. However, users can apply a "Root Key" bias to the secrets through the settings page. The "Root Key" will be used when reading, creating and updating secrets such that the value displayed in the UI is the value stored at the "Root Key". For example, if the secret at `secret/hello` is `{ "value": "world" }`, setting the "Root Key" to `value` will update the UI such that the secret will display as simply "world" instead of `{ "value": "world" }`.
<img src="https://github.com/djenriquez/vault-ui/raw/master/images/RootKey.png" height="240">

## Policies
Policies can be entered in as JSON or as HCL. If entered in as HCL, it will be converted to JSON as required for the PUT command in Vault's API. However, existing policies that are in HCL will continue to be displayed in HCL.

## Response Wrapping
Vault-UI supports response-wrapping raw values. It currently does not support wrapping of existing secrets.
![Response Wrapping](https://github.com/djenriquez/vault-ui/raw/master/images/ResponseWrapping.png)

## Run
Vault-UI Docker images are automatically built using an [automated build
on Docker Hub](https://hub.docker.com/r/djenriquez/vault-ui/builds/).
To run Vault-UI using the latest Docker image:
```bash
docker run -d \
-p 8000:8000 \
--name vault-ui \
djenriquez/vault-ui
```

### Skip TLS Verification
In the case that you need to skip TLS verification, say for self-signed certs, you can run Vault-UI with the environment variable `NODE_TLS_REJECT_UNAUTHORIZED=0`:
```
docker run -d \
-p 8000:8000 \
-e NODE_TLS_REJECT_UNAUTHORIZED=0 \
--name vault-ui \
djenriquez/vault-ui
```

## Development

### With Docker
The command below will use [Docker Compose](https://docs.docker.com/compose/)
to spin up a Vault dev server and a Vault UI server that you can log
into with username "test" and password "test":
```sh
./run-docker-compose-dev
```

### Without Docker
The following will spin up a Vault UI server only. It will not set up
Vault for you:
```sh
npm install

# If you do not have webpack installed globally
npm install -g webpack

npm start
webpack -w
```

# Licensing
Vault-UI is licensed under BSD 2-Clause. See [LICENSE](https://github.com/djenriquez/vault-ui/blob/master/LICENSE) for the full license text.
