#!/bin/bash

set -o xtrace

docker rmi localhost/postpilot || true
docker build --target dist -t localhost/postpilot -f Dockerfile.dev .
