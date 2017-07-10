#!/bin/sh

if [[ ! -z "$CUSTOM_CA_CERT" ]]; then
  echo "$CUSTOM_CA_CERT" > misc/custom_ca.crt
  export NODE_EXTRA_CA_CERTS=misc/custom_ca.crt
fi

if [ "$1" = 'start_app' ]; then
  exec yarn run serve "$@"
fi

exec "$@"
