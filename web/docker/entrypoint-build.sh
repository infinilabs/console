#!/bin/sh

lockPath="/tmp/init.lock"

npm config set registry http://registry.npm.taobao.org/;

cd /usr/src/app

echo "START TO RELEASE INFINI-LOGGING-CENTER"

if [ ! -f "$lockPath" ]; then
  npm install --registry=https://registry.npm.taobao.org
  npm run build
else
  npm run build
fi
