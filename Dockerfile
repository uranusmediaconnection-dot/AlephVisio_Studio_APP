# Hugging Face Space (sdk: docker, app_port: 7860, see README.md).
# Serves the built Andromeda frontend + the Express events API on one port.
FROM node:22-slim

ENV NODE_ENV=production
ENV PORT=7860

WORKDIR /app

COPY . .

RUN npm --prefix "workspace/calendar full implementation" install --no-audit --no-fund \
  && npm --prefix "workspace/calendar full implementation/medical-dashboard" install --no-audit --no-fund \
  && npm --prefix "workspace/calendar full implementation/medical-dashboard" run build \
  && node "workspace/calendar full implementation/backend/copyFrontend.js"

EXPOSE 7860

CMD ["node", "workspace/calendar full implementation/backend/server.js"]
