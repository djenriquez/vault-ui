FROM node:8.4.0-alpine

MAINTAINER Vault-UI Contributors

WORKDIR /app
COPY . .

RUN yarn install --pure-lockfile --silent && \
    yarn run build-web && \
    yarn install --silent --production && \
    yarn check --verify-tree --production && \
    yarn global add nodemon && \
    yarn cache clean && \
    rm -f /root/.electron/*

EXPOSE 8000

ENTRYPOINT ["./bin/entrypoint.sh"]
CMD ["start_app"]
