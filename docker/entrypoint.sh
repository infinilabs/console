#!/bin/sh

lockPath="/tmp/init.lock"

npm config set registry http://registry.npm.taobao.org/;

cd /usr/src/app

echo "START INFINI-LOGGING-CENTER v1.0"

if [ ! -f "$lockPath" ]; then
  npm i --production;
#   npm run autod
  npm run dev
else
  npm run dev
fi
