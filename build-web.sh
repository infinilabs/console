#!/bin/bash

WORKBASE=/home/jenkins/go/src/infini.sh/console

if [ -d $WORKBASE/.public ]; then
  rm -rf $WORKBASE/.public
fi

if [ ! -d $WORKBASE/web ]; then
  git clone ssh://git@git.infini.ltd:64221/infini/console-ui.git web
fi

cd $WORKBASE/web
git pull origin master

cnpm install

cnpm run --silent build

mv $WORKBASE/web/.public $WORKBASE
