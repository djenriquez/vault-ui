# Vault-UI
[![](https://images.microbadger.com/badges/image/djenriquez/vault-ui.svg)](https://microbadger.com/images/djenriquez/vault-ui)
[![Run Status](https://api.shippable.com/projects/581a2fc51ae1890f00d3dd6c/badge?branch=master)](https://app.shippable.com/projects/581a2fc51ae1890f00d3dd6c)

A beautiful way to manage your secrets in Vault

# Configuration
Configuration is accessed by clicking on the configuration cog on the login page.
## Vault Endpoint
Users can enter in the full endpoint to Vault, including scheme.
## Authentication
There are currently three supported authentication backends. [Github](https://www.vaultproject.io/docs/auth/github.html), [Username and Password](https://www.vaultproject.io/docs/auth/userpass.html), and [Token](https://www.vaultproject.io/docs/auth/token.html). 

# Run
Vault-UI is attached to an automated build on Docker Hub. To run Vault-UI:
```bash
docker run -d \
-p 8000:8000 \
--name vault-ui \
djenriquez/vault-ui
```

# Licensing
Vault-UI is licensed under BSD 2-Clause. See [LICENSE](https://github.com/djenriquez/vault-ui/blob/master/LICENSE) for the full license text.