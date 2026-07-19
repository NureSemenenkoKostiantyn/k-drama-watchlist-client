FROM node:22-bookworm-slim AS development

ENV NODE_ENV=development
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY angular.json tsconfig.json tsconfig.app.json tsconfig.spec.json ./
COPY proxy.conf.json proxy.compose.conf.json ./
COPY public ./public
COPY src ./src

EXPOSE 4200

CMD ["npm", "run", "dev:compose"]
