FROM node:8.11.3-alpine

ENV TIME_ZONE=Asia/Shanghai

RUN \
  mkdir -p /usr/src/app \
  && apk add --no-cache tzdata \
  && echo "${TIME_ZONE}" > /etc/timezone \ 
  && ln -sf /usr/share/zoneinfo/${TIME_ZONE} /etc/localtime 

WORKDIR /usr/src/app

COPY package.json /usr/src/app/

RUN npm install --registry=https://registry.npm.taobao.org

COPY . /usr/src/app

EXPOSE 10000

CMD npm run dev