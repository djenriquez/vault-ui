# 2.1.0 (Unreleased)
- Support AWS EC2 authentication backend
- Support Okta authentication backend
- Provide ability to sort secrets
- Allow naming tokens generated from roles

# 2.0.1
- Fix reference to Vault icon

# 2.0.0
- Improved the UI as a whole - https://github.com/djenriquez/vault-ui/pull/47
  - Added a dynamic navigation menu bar
  - Added ability to renew token before expiration
  - Improved wrapping experience - https://github.com/djenriquez/vault-ui/pull/47/commits/ac71bb60830fa79cc298176e50fa9fcbbb2569b3
    - Added ability to wrap secrets - https://github.com/djenriquez/vault-ui/pull/47/commits/8f6fde521a7fe39f439e800a484aa7435f2bd4c5
  - Consolidated error reporting - https://github.com/djenriquez/vault-ui/pull/47/commits/de85678d2126ec71ce0908eb3eb09172cb2f11e0
- Support Radius auth backend - https://github.com/djenriquez/vault-ui/pull/59
- Reduced the footprint of the Docker image - https://github.com/djenriquez/vault-ui/pull/53
- Added ability to manage secret and authentication backends - https://github.com/djenriquez/vault-ui/pull/62
- Support custom login mountpoint paths - https://github.com/djenriquez/vault-ui/pull/60
- Support mount management for generic, github and radius- https://github.com/djenriquez/vault-ui/pull/62

# 1.0.1
- Fixed slight token management issues - https://github.com/djenriquez/vault-ui/pull/48

# 1.0.0
- React best-practices inspired refactor - https://github.com/djenriquez/vault-ui/pull/32
- Update backend API to match Vault API by using the express server as a passthrough - https://github.com/djenriquez/vault-ui/pull/46
- Added ability to set Default URL + Auth with environment variables - https://github.com/djenriquez/vault-ui/pull/36
- Added `VAULT_SUPPLIED_TOKEN_HEADER` header to enable SSO functionality - [Feature request #39](https://github.com/djenriquez/vault-ui/issues/39) + #40 
- Support multiple generic backends - https://github.com/djenriquez/vault-ui/pull/31
- Fixed bug with auto-logout where large values caused logout to happen immediately - https://github.com/djenriquez/vault-ui/pull/35
- Improved value editting with [josdejong/jsoneditor](josdejong/jsoneditor) - https://github.com/djenriquez/vault-ui/pull/38 (Note: HCL is no longer supported as a format for managing secrets or policies)
- Add `Token management` - [Feature request #41](https://github.com/djenriquez/vault-ui/issues/41)

# 0.1.0
Initial stable release
## Features
- Supports [Github, Username and Password, Token](https://github.com/djenriquez/vault-ui/pull/3), and [LDAP](https://github.com/djenriquez/vault-ui/pull/16) authentication
- Full [generic secrets management](https://github.com/djenriquez/vault-ui/pull/2)
- Full [policies management](https://github.com/djenriquez/vault-ui/pull/4)
- Full [response wrapping support](https://github.com/djenriquez/vault-ui/pull/18)
- Full [GitHub auth backend team/org policy management](https://github.com/djenriquez/vault-ui/pull/13)