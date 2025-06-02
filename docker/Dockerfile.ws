FROM node:slim

WORKDIR /app

COPY ./apps/websocket/package*.json ./

RUN npm install

RUN npm install -g typescript ts-node

COPY ./apps/websocket/ ./   

RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]