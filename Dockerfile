FROM node:20-alpine
WORKDIR /app

COPY package.json ./
RUN npm install

COPY meih/backend ./meih/backend
COPY meih/frontend ./meih/frontend

RUN mkdir -p meih/backend/uploads/payments

ENV NODE_ENV=production
EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:10000/health || exit 1

CMD ["npm", "start"]
