#!/usr/bin/env bash

# Tag based on release
if [[ $BRANCH == dev ]]; then DOCKER_TAG=dev; fi
if [[ $BRANCH == master ]]; then DOCKER_TAG=latest; fi
if [[ $IS_GIT_TAG == true ]]; then DOCKER_TAG=$GIT_TAG_NAME; fi

# Push
if [[ $BRANCH == dev || $BRANCH == master || $IS_GIT_TAG == true ]]; then
    docker tag -f ${PROJECT}:ci djenriquez/vault-ui:${DOCKER_TAG}
    docker push djenriquez/vault-ui:$DOCKER_TAG
else
    echo "This branch is not configured to be deployed"
fi