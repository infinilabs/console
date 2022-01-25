#!/bin/sh

cd /go/src/infini.sh/

echo "INFINI GOLANG ENV READY TO ROCK!"

cd search-center
make build

cd /go/src/infini.sh/console && ./bin/search-center