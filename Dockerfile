FROM node:slim

MAINTAINER Team Lecretius

ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /app/ && cp -a /tmp/node_modules /app/

RUN npm install --silent -g webpack

ADD . /app
WORKDIR /app

RUN webpack && npm run build

EXPOSE 8000

CMD ["npm", "run", "serve"]