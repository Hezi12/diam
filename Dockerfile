# Stage 1: Build React client
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production server
FROM node:18-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm install --production
COPY server/ ./
COPY --from=client-build /app/client/build ./client-build
EXPOSE 3200
CMD ["node", "server.js"]
