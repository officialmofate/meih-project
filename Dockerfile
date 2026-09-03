FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

# Install backend dependencies first (better layer caching)
COPY meih/backend/package.json meih/backend/package-lock.json ./meih/backend/
RUN cd meih/backend && npm ci --omit=dev

# Copy source code
COPY meih/backend ./meih/backend
COPY meih/frontend ./meih/frontend

# Create upload directories
RUN mkdir -p /app/meih/backend/uploads/payments \
    && mkdir -p /app/meih/backend/uploads/profiles

# Default port (overridable via PORT env var)
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "/app/meih/backend/src/index.js"]
