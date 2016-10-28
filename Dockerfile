FROM node:6.9.1

RUN npm install -g yarn

RUN yarn global add \
    typescript \
    gulp \
    typings \
    aurelia-cli

ARG APP_RELEASE=v0.0.0
ARG GITHUB_KEY=xyz

RUN git clone https://$GITHUB_KEY@github.com/Resounding/GreenRP /usr/src/GreenRP

WORKDIR /usr/src/GreenRP
RUN git checkout $APP_RELEASE

RUN yarn install --ignore-scripts
RUN typings install

RUN mkdir -p /usr/src/GreenRP/export
RUN au build --env prod
