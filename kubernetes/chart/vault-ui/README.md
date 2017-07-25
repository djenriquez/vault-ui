# Helm chart

[Helm](chart) to deploy `vault-ui` in a kubernetes cluster. To run this chart you need to have a kubernetes cluster and helm installed and configured properly. To install `vault-ui` you just need to execute the following `helm` command: 

```
helm install ./chart/vault-ui
```

To run this chart you need 2 settings: 

* VAULT_URL_DEFAULT: http://vault-service-name:8200
* VAULT_AUTH_DEFAULT: by default is token, but you can use any of the 4 options provided.


```
helm install ./chart/vault-ui --set vault.url=http://MY_RELEASE-vault:8200"
```

The `vault.url` parameter is the value of your kubernetes `vault` service.
