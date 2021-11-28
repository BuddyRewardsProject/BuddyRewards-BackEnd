FROM node:16.13.0-alpine

WORKDIR /app

COPY . /app
RUN yarn

EXPOSE 3001

ENTRYPOINT ["yarn","dev"]