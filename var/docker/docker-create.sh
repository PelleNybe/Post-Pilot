#!/usr/bin/env bash

docker kill postpilot || true 
docker rm postpilot || true 
docker create --name postpilot -p 3000:3000 -p 4200:4200 localhost/postpilot
