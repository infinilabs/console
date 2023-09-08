#!/bin/bash

WORKBASE=/home/jenkins/go/src/infini.sh/console

if [ -d $WORKBASE/.public ]; then
  echo "clean exists .pulbic folder."
  rm -rf $WORKBASE/.public
fi

if [ ! -d $WORKBASE/web ]; then
  git clone ssh://git@git.infini.ltd:64221/infini/console-ui.git web
fi

if [ ! -d $WORKBASE/web/src/common ]; then
  cd $WORKBASE/web/src
  git clone ssh://git@git.infini.ltd:64221/infini/common-ui.git common
fi

cd $WORKBASE/web
git pull origin master

cd $WORKBASE/web/common
git pull origin master

git log --pretty=oneline -5

#--quiet
cnpm install --quiet --no-progress

cnpm run build --quiet &>/dev/null
