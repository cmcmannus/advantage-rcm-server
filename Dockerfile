FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install -g nodemon && npm install
COPY . .
CMD ["nodemon", "--watch", "src", "src/server.ts"]
