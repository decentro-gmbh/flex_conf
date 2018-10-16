####################################################################################
# flex_conf Dockerfile for local testing/ development
# @author Benjamin Assadsolimani
#
# BUILD: docker build --rm -f Dockerfile -t flex_conf:latest .
# RUN: docker run --rm -it --name flex_conf --entrypoint=/bin/bash -v $(pwd):/app -p "127.0.0.1:9123:9229" flex_conf:latest
#
####################################################################################

FROM node:10.6.0-stretch
LABEL maintainer="Benjamin Assadsolimani"
WORKDIR /app
# Keep container alive so that a dev can attach to it with a shell
ENTRYPOINT tail -f /dev/null
