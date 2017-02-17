FROM node:slim

MAINTAINER Vault-UI Contributors

ADD package.json /tmp/package.json
RUN cd /tmp && npm install --silent && mkdir -p /app/ && mv /tmp/node_modules /app/

RUN npm install --silent -g webpack

ADD . /app
WORKDIR /app

RUN npm run build

EXPOSE 8000

CMD ["npm", "run", "serve"]
