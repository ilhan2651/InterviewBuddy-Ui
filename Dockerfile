# 1. Build Aşaması (Node.js)
FROM node:20-alpine AS build
WORKDIR /app

# Paket dosyalarını kopyala ve bağımlılıkları yükle
COPY package*.json ./
RUN npm install

# Tüm kodları kopyala ve derle
COPY . .
# ÖNEMLİ: API URL'ini container build edilirken vereceğiz
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# 2. Çalışma Aşaması (Nginx)
FROM nginx:alpine
# Nginx'in varsayılan html klasörüne derlenen dosyaları kopyala
COPY --from=build /app/dist /usr/share/nginx/html

# React/Vue router kullanılıyorsa Nginx'i SPA'ya (Single Page Application) göre ayarla
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $$uri $$uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
