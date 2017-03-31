FROM node:alpine

MAINTAINER Vault-UI Contributors

ADD . /app
WORKDIR /app
RUN npm install --silent && npm run build-web && npm prune --silent --production

EXPOSE 8000

CMD ["npm", "run", "serve"]
