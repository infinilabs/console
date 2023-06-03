#!/bin/bash

WORKBASE=/home/jenkins/go/src/infini.sh/console
if [ ! -d $WORKBASE/web ]; then
  git clone ssh://git@git.infini.ltd:64221/infini/console-ui.git web
fi
cd $WORKBASE/web && git pull origin master && git stash
cnpm install && cnpm run build
