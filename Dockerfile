FROM node:18.20.5-alpine AS build

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

FROM node:18.20.5-alpine AS production

WORKDIR /app

COPY package*.json .

RUN npm ci --only=production

COPY --from=build /app/dist ./dist

COPY --from=build /app/tsconfig.json ./dist

COPY --from=build /app/orders-app-key.json .

CMD ["node", "dist/server.js"]