#!/bin/sh

lockPath="/tmp/init.lock"

npm config set registry http://registry.npm.taobao.org/;

cd /usr/src/app

echo "START DEBUG INFINI-SEARCH-CENTER"

if [ ! -f "$lockPath" ]; then
  npm install --registry=https://registry.npm.taobao.org
  npm run dev
else
  npm run dev
fi
