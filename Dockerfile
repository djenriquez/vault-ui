FROM node:slim

MAINTAINER Vault-UI Contributors

ADD . /app
WORKDIR /app
RUN npm install --silent && npm run build-web

EXPOSE 8000

CMD ["npm", "run", "serve"]
