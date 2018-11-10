FROM node:10-alpine

RUN \
    apk update && \
    apk add git ffmpeg && \
    rm -rf /var/cache/apk/*

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV
COPY package.json /usr/src/app/
#RUN npm install
COPY . /usr/src/app

#CMD [ "npm", "install" ]
COPY run.sh /usr/local/bin/run
RUN chmod +x /usr/local/bin/run
CMD [ "run" ]
