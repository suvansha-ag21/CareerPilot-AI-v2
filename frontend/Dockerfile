FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/

RUN npm install

COPY shared ./shared
COPY frontend ./frontend

ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm --workspace=frontend run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache curl wget

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/src ./shared/src
COPY --from=builder /app/shared/package.json ./shared/package.json
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/package.json ./frontend/package.json

ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "npx --workspace=frontend next start -p ${PORT:-3000}"]
