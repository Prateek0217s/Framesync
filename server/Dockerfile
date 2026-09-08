# FrameSync API — Express + Socket.io (PDD §12 Phase 8).
FROM node:20-alpine

WORKDIR /app

# Install production deps first for layer caching.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
# Matches the port nginx proxies to in docker-compose.yml.
EXPOSE 5001

CMD ["node", "server.js"]
