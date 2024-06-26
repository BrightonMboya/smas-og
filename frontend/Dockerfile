FROM node:16 as build
WORKDIR /app
COPY build ./build
COPY public ./public
COPY .env .
FROM nginx
EXPOSE 3000
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html