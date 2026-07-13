FROM node:20-alpine AS build

WORKDIR /app

COPY . /app

RUN node scripts/build.mjs

FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html

COPY .docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 80
