FROM node:16
WORKDIR /app
COPY package.json .
# RUN npm install
COPY dist ./dist
COPY public ./public
COPY .env .
EXPOSE 2001
CMD ["npm", "run", "docker"]