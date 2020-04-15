#
# vMonitor Dockerfile
#
# Author: Igor Fritzsch
# Created 18.04.2018
# See https://docs.docker.com/get-started/part2/#dockerfile
# vMonitor is a nodejs webserver listen on port 9000 that displays vSpeech output and live video stream

# docker rmi vmonitor
# docker build -t vmonitor .
# docker run --name vmonitor -e "SOURCE_STREAM_URL=rtmp://192.168.50.105/live/teststream" -p 9000:9000 -d vmonitor
# docker run --name vmonitor -e "SOURCE_STREAM_URL=rtmp://192.168.50.105/live/teststream" -p 9000:9000 -it vmonitor /bin/bash

# Use the official debian runtime as a parent image
FROM debian:stretch-slim

# Install the basic things
RUN apt-get update \
   && apt-get install -y \
      sudo \
      curl \
	  gnupg1 \
   && apt-get install -y \
      ffmpeg \
   && apt-get clean \
   && rm -rf /var/lib/apt/lists/*

# Install nodejs
RUN curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
RUN apt-get install -y nodejs

# Copy nodejs service
COPY /vmonitor /opt/

# Set the working directory
WORKDIR /opt/

# Run service
RUN npm install

# Run service forever
CMD node ./bin/www

# Expose port 8090 9000
EXPOSE 8090 9000
