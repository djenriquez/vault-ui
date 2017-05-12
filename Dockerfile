FROM node:alpine

MAINTAINER Vault-UI Contributors

ADD . /app
WORKDIR /app
RUN yarn install --pure-lockfile --silent && yarn run build-web && npm prune --silent --production && yarn cache clean

EXPOSE 8000

CMD ["yarn", "run", "serve"]
