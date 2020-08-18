#!/bin/bash

set -e
set -x

source scripts/functions.sh

init
startZero
start

sleep 10 # Dgraph need some time to create Groot user

npm run build
npm test

quit 0
