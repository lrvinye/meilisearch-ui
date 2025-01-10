FROM node:22 AS build

# Setting working directory.
WORKDIR /opt/meilisearch-ui

RUN npm install -g pnpm

# Copying source files
COPY . .

# Installing dependencies
RUN pnpm install

# Build the app
RUN npm run build

# -------
FROM nginx

COPY --from=build /opt/meilisearch-ui/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 24900
