FROM node:20-bookworm-slim

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install --production

COPY server.js ./

EXPOSE 3000
CMD ["node", "server.js"]