FROM node:7-alpine

MAINTAINER Vault-UI Contributors

WORKDIR /app
COPY . .

RUN yarn install --pure-lockfile --silent && \
    yarn run build-web && \
    npm prune --silent --production && \
    yarn cache clean && \
    rm -f /root/.electron/*

EXPOSE 8000

ENTRYPOINT ["./bin/entrypoint.sh"]
CMD ["start_app"]
