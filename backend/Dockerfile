FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY database/prisma ./database/prisma

RUN npm install

COPY shared ./shared
COPY backend ./backend

RUN npm run build:shared
RUN npm --workspace=backend run prisma:generate
RUN npm --workspace=backend run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/database/prisma ./database/prisma

EXPOSE 5000
CMD ["node", "backend/dist/server.js"]
