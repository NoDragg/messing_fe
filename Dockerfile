# syntax=docker/dockerfile:1

# ==============================
# STAGE 1: Build frontend (Vue + Vite)
# ==============================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifest trước để tận dụng cache
COPY package*.json ./

# Cài dependencies (dùng npm ci nếu có lockfile)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy toàn bộ source
COPY . .

# Build production assets -> /app/dist
RUN npm run build


# ==============================
# STAGE 2: Serve static bằng Nginx
# ==============================
FROM nginx:1.27-alpine

# Cấu hình Nginx cho SPA + proxy API/WS
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy file build vào web root
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
