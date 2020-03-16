FROM alpine:latest

ENV TIME_ZONE=Asia/Shanghai

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories \
  && apk update \
  && apk add --no-cache shadow git nodejs nodejs-current-npm bash vim tar curl python python-dev py-pip gcc libcurl make\
  && usermod -s /bin/bash root \
  && rm -rf /var/cache/apk/* 


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

#CMD npm run dev
ENTRYPOINT ["/entrypoint.sh"]