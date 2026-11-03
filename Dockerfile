# ---- Build: gera os arquivos estáticos em /app/dist ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime: nginx serve o SPA e repassa /api para o back-end ----
FROM nginx:1.27-alpine
# A imagem oficial do nginx roda envsubst nos *.template ao subir,
# preenchendo ${PORT} (definida pelo Railway) e ${BACKEND_URL}
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV PORT=80
# Padrão = back-end da demo; sobrescreva com a variável BACKEND_URL no Railway
ENV BACKEND_URL=https://radio-gestao-production.up.railway.app
