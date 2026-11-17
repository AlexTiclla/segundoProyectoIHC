FROM node:24-alpine AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS compilacion
WORKDIR /app
ARG URL_BASE=http://backend:8000
ENV NEXT_TELEMETRY_DISABLED=1 \
    URL_BASE=${URL_BASE}
COPY --from=dependencias /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS produccion
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    URL_BASE=http://backend:8000

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=compilacion --chown=nextjs:nodejs /app/public ./public
COPY --from=compilacion --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=compilacion --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
