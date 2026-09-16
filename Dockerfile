FROM node:22-bookworm

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY backend ./backend

WORKDIR /app/backend

EXPOSE 5000

CMD ["node", "index.js"]