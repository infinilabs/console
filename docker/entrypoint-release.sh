#!/bin/sh

lockPath="/tmp/init.lock"

npm config set registry http://registry.npm.taobao.org/;

cd /usr/src/app

echo "START BUILD INFINI-LOGGING-CENTER v1.0"

if [ ! -f "$lockPath" ]; then
  npm install --registry=https://registry.npm.taobao.org
  npm run build
  npm run start
else
  npm run build
  npm run start
fi
