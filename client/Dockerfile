# FrameSync client — Vite build served by nginx (PDD §12 Phase 8).
# nginx proxies /api and /socket.io to the api service, so the browser stays
# same-origin in production exactly like the Vite dev proxy.

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
