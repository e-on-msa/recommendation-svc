FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM node:20-alpine

RUN apk add --no-cache netcat-openbsd

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app .

EXPOSE 8085

CMD ["node", "index.js"]
