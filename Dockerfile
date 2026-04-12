FROM node:20-alpine

WORKDIR /app

COPY . .

RUN if [ -d api ]; then \
      mkdir -p apps packages && \
      mv api apps/api && \
      mv shared packages/shared && \
      mv prediction packages/prediction; \
    fi

RUN npm install
RUN npm run build:shared && npm run build:prediction && npm run build:api

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
