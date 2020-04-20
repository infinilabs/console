#!/bin/sh

cd /go/src/infini.sh/

echo "INFINI GOLANG ENV READY TO ROCK!"

cd logging-center
make build

cd /go/src/infini.sh/logging-center && ./bin/logging-center