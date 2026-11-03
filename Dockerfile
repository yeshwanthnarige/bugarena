FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
COPY package.json package-lock.json ./
RUN npm ci && npx playwright install --with-deps chromium && chmod -R a+rX /ms-playwright
COPY src ./src
COPY examples ./examples
COPY scripts ./scripts
RUN mkdir -p /app/runs && chown -R node:node /app
USER node
ENV DASHBOARD_PUBLIC=1 PORT=10000
EXPOSE 10000
CMD ["node", "scripts/start-hosted.js"]
