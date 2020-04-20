FROM golang:alpine

ENV TIME_ZONE=Asia/Shanghai

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories \
  && apk update \
  && apk add --no-cache shadow git bash perl openssh vim tar curl python python-dev py-pip gcc g++ libcurl make\
  && usermod -s /bin/bash root \
  && rm -rf /var/cache/apk/* 


RUN \
  mkdir -p /go/src/infini.sh/ \
  && apk add --no-cache tzdata \
  && echo "${TIME_ZONE}" > /etc/timezone \ 
  && ln -sf /usr/share/zoneinfo/${TIME_ZONE} /etc/localtime 

WORKDIR /go/src/infini.sh/

COPY ./entrypoint.sh /
COPY ./ssh_config /etc/ssh/ssh_config
COPY deploy.key /root/.ssh/id_rsa
RUN perl -pi -e 's/\r\n/\n/g' /root/.ssh/id_rsa
RUN chmod 600 /root/.ssh/id_rsa

EXPOSE 9000

#CMD npm run dev
ENTRYPOINT ["/entrypoint.sh"]