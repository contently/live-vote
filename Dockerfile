FROM node:11.9.0
RUN mkdir code
WORKDIR /code
COPY ./package.json ./yarn.lock ./
RUN yarn install
COPY ./webpack.config.js ./.eslintrc ./.babelrc ./
COPY ./src ./src
COPY ./public ./public
RUN pwd
RUN ls -la
RUN yarn build
EXPOSE 3000
ENTRYPOINT [ "node","./src/server/server.js" ]
