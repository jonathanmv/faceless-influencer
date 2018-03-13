# Taken from https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:carbon

RUN echo OS info
RUN cat /etc/os-release

# Install ffmpeg
# https://superuser.com/a/1082860

## Adding backports source
RUN echo Adding jessie-backports source
RUN echo "deb http://ftp.debian.org/debian jessie-backports main" >> /etc/apt/sources.list

## Installing ffmpeg
RUN echo Installing ffmpeg
RUN apt-get update
RUN apt-get install -y --force-yes ffmpeg

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

#EXPOSE 8080
CMD [ "npm", "start" ]
