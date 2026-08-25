# ------------------------------------------------------------
# Etapa 1: Build & Dependencias
# ------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos
COPY package*.json ./
COPY tsconfig.json ./

# Instalar todas las dependencias para compilar
RUN npm ci

# Copiar código fuente
COPY src/ ./src/

# Compilar TypeScript
RUN npm run build

# ------------------------------------------------------------
# Etapa 2: Runtime Liviano para Producción (Railway)
# ------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copiar package files e instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiar build compilado desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Usuario sin privilegios por seguridad
USER node

# Exponer puerto para Railway
EXPOSE 8080

CMD ["node", "dist/index.js"]
