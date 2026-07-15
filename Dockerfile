FROM node:20-alpine
WORKDIR /app

COPY meih/backend/package*.json ./meih/backend/
RUN cd meih/backend && npm install

COPY meih/backend ./meih/backend
COPY meih/frontend ./meih/frontend
RUN mkdir -p meih/backend/uploads/payments

ENV NODE_ENV=production
EXPOSE 10000

CMD ["node", "meih/backend/src/index.js"]
