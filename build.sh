 #!/bin/bash

#init
PNAME=console
WORKBASE=/home/jenkins/go/src/infini.sh
WORKDIR=$WORKBASE/$PNAME

if [[ $VERSION =~ NIGHTLY ]]; then
  BUILD_NUMBER=$BUILD_DAY
fi
export DOCKER_CLI_EXPERIMENTAL=enabled

#clean all
cd $WORKSPACE && git clean -fxd

#pull code
cd $WORKDIR && git clean -fxd -e ".public"
git stash && git pull origin master

 #build
make clean config build-linux
make config build-arm
make config build-darwin
make config build-win
GOROOT="/infini/go-pkgs/go-loongarch" PATH=$GOROOT/bin:$PATH make build-linux-loong64
#GOROOT="/infini/go-pkgs/go-swarch" PATH=$GOROOT/bin:$PATH make build-linux-sw64

#copy-configs
cp -rf $WORKBASE/framework/LICENSE $WORKDIR/bin && cat $WORKBASE/framework/NOTICE $WORKDIR/NOTICE > $WORKDIR/bin/NOTICE
mkdir -p $WORKDIR/bin/config && cp $WORKDIR/config/*.json $WORKDIR/bin/config && cp -rf $WORKDIR/config/*.tpl $WORKDIR/bin/config

cd $WORKDIR/bin
for t in 386 amd64 arm64 armv5 armv6 armv7 loong64 mips mips64 mips64le mipsle riscv64 ; do
  tar zcf ${WORKSPACE}/$PNAME-$VERSION-$BUILD_NUMBER-linux-$t.tar.gz "${PNAME}-linux-$t" $PNAME.yml LICENSE NOTICE config
done

for t in mac-amd64 mac-arm64 windows-amd64 windows-386 ; do
  cd $WORKDIR/bin && zip -qr ${WORKSPACE}/$PNAME-$VERSION-$BUILD_NUMBER-$t.zip $PNAME-$t $PNAME.yml LICENSE NOTICE config
done

#build image & push
for t in amd64 arm64 ; do
  cat <<EOF>Dockerfile
FROM --platform=linux/$t alpine:3.16.5
MAINTAINER "hardy <luohoufu@gmail.com>"
ARG APP_NAME=$PNAME
ARG APP_HOME=/opt/\${APP_NAME}
ENV APP=\${APP_NAME}
WORKDIR \${APP_HOME}

COPY ["$PNAME-linux-$t", "$PNAME.yml", "config", "\${APP_HOME}/"]

CMD ["/opt/$PNAME/${PNAME}-linux-$t"]
EOF

  docker buildx build -t infinilabs/$PNAME-$t:latest --platform=linux/$t -o type=docker .
  docker push infinilabs/$PNAME-$t:latest
  docker tag infinilabs/$PNAME-$t:latest infinilabs/$PNAME-$t:$VERSION-$BUILD_NUMBER
  docker push infinilabs/$PNAME-$t:$VERSION-$BUILD_NUMBER
done

#composite tag
docker buildx imagetools create -t infinilabs/$PNAME:latest \
    infinilabs/$PNAME-arm64:latest \
    infinilabs/$PNAME-amd64:latest

docker buildx imagetools create -t infinilabs/$PNAME:$VERSION-$BUILD_NUMBER \
    infinilabs/$PNAME-arm64:$VERSION-$BUILD_NUMBER \
    infinilabs/$PNAME-amd64:$VERSION-$BUILD_NUMBER

#git reset
cd $WORKSPACE && git reset --hard
cd $WORKDIR && git reset --hard

#clean weeks ago image
NEEDCLEN=$(docker images |grep "$PNAME" |grep "weeks ago")
if [ ! -z "$NEEDCLEN" ]; then
  docker images |grep "$PNAME" |grep "weeks ago" |awk '{print $3}' |xargs docker rmi
fi
