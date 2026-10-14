# =========================================================
# DOCKERFILE - BLOG / CMS APPLICATION
# Ap dung Container Hardening: Non-root User
# =========================================================

FROM node:20-alpine AS base

# Cai dat curl cho container healthcheck
RUN apk add --no-cache curl

# Thiet lap thu muc lam viec
WORKDIR /usr/src/app

# Sao chep file phu thuoc
COPY package*.json ./

# Cai dat dependencies (chi production packages)
RUN npm install --omit=dev

# Sao chep ma nguon ung dung
COPY . .

# =========================================================
# HARDENING: Chay duoi quyen nguoi dung khong dac quyen (non-root)
# Ngan chan lo hong Container Escape
# =========================================================
USER node

# Mo cong dich vu
EXPOSE 3000

# Health check dinh ky
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Lenh khoi dong
CMD ["node", "server.js"]
