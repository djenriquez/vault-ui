# 2.3.0 (Unreleased)
- Allow naming tokens generated from roles
- Add backend mount description field - https://github.com/djenriquez/vault-ui/pull/105

# 2.2.0
## Features
- Add filtering to all lists - https://github.com/djenriquez/vault-ui/pull/106
- Add pagination to secrets list - https://github.com/djenriquez/vault-ui/pull/110
- Add JSON diff view to compare updates - https://github.com/djenriquez/vault-ui/pull/84
- Add ability to renew token - https://github.com/djenriquez/vault-ui/pull/114
- Add AWS auth backend with IAM - https://github.com/djenriquez/vault-ui/pull/126

## Enhancements
- Optimize Docker image size + caching - https://github.com/djenriquez/vault-ui/pull/122

## Bug fixes
- Fix issue with secrets loading causing UI to be unresponsive - https://github.com/djenriquez/vault-ui/pull/110
- Fix docker build electron dependency - https://github.com/djenriquez/vault-ui/pull/112
- Fix issue with sorting/pagination of secrets not affecting the entire secret namespace - https://github.com/djenriquez/vault-ui/pull/127 & https://github.com/djenriquez/vault-ui/pull/134
- Fix issue with trailing slashes being sent to Vault requests - https://github.com/djenriquez/vault-ui/pull/104

# 2.1.0
## Features
- Support AWS EC2 authentication backend - https://github.com/djenriquez/vault-ui/pull/76
- Support User/Pass authentication backend - https://github.com/djenriquez/vault-ui/pull/94
- Improve GitHub authentication backend - https://github.com/djenriquez/vault-ui/pull/78
- Provide ability to sort secrets - https://github.com/djenriquez/vault-ui/pull/82
- Improvements to backend code + upgrade React components - https://github.com/djenriquez/vault-ui/pull/93
- Support use with new Desktop App - https://github.com/djenriquez/vault-ui/pull/85

## Bug Fixes
- Fix 307 redirects

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
- Supports [Github, Username and Password, Token](https://github.com/djenriquez/vault-ui/pull/3), and [LDAP](https://github.com/djenriquez/vault-ui/pull/16) authentication
- Full [generic secrets management](https://github.com/djenriquez/vault-ui/pull/2)
- Full [policies management](https://github.com/djenriquez/vault-ui/pull/4)
- Full [response wrapping support](https://github.com/djenriquez/vault-ui/pull/18)
- Full [GitHub auth backend team/org policy management](https://github.com/djenriquez/vault-ui/pull/13)
