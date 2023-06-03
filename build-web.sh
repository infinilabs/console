#!/bin/bash

WORKBASE=/home/jenkins/go/src/infini.sh/console

if [ -d $WORKBASE/.public ]; then
  echo "clean exists .pulbic folder."
  rm -rf $WORKBASE/.public
fi

if [ ! -d $WORKBASE/web ]; then
  git clone ssh://git@git.infini.ltd:64221/infini/console-ui.git web
fi

cd $WORKBASE/web
echo "build console ui to .public."
git pull origin master

cnpm install --quiet

cnpm run build --silent

mv $WORKBASE/web/.public $WORKBASE
