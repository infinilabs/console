#!/bin/sh

npm config set registry http://registry.npm.taobao.org/;

cd /usr/src/app

echo "START TO RELEASE INFINI-LOGGING-CENTER"

npm install --registry=https://registry.npm.taobao.org
npm run build
