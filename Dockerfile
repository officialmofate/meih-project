FROM node:20-alpine AS base
WORKDIR /app

# ── Backend ──
COPY meih/backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY meih/backend/src ./backend/src
RUN mkdir -p backend/uploads/payments

# ── Frontend ──
COPY meih/frontend ./frontend

# ── Final image ──
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "backend/src/index.js"]
