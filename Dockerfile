FROM node as base

LABEL fly_launch_runtime="Node.js"

WORKDIR /app
ENV NODE_ENV="production"
RUN npm i -g pnpm


FROM base as build
COPY . .
RUN pnpm i && pnpm build


FROM base
COPY --from=build /app /app
EXPOSE 3000
CMD [ "pnpm", "start" ]
