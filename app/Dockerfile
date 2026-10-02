# =========================================================
# DOCKERFILE - BLOG / CMS APPLICATION
# Áp dụng Container Hardening: Multi-stage hoặc Non-root User
# =========================================================

FROM node:20-alpine AS base

# Cài đặt curl cho container healthcheck
RUN apk add --no-cache curl

# Thiết lập thư mục làm việc
WORKDIR /usr/src/app

# Sao chép file phụ thuộc
COPY package*.json ./

# Cài đặt dependencies (chỉ production packages)
RUN npm install --omit=dev

# Sao chép mã nguồn ứng dụng
COPY . .

# =========================================================
# HARDENING: Chạy dưới quyền người dùng không đặc quyền (non-root)
# Ngăn chặn lỗ hổng Container Escape
# =========================================================
USER node

# Mở cổng dịch vụ
EXPOSE 3000

# Health check định kỳ
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Lệnh khởi động
CMD ["node", "server.js"]
