FROM node:18-alpine

WORKDIR /blockchain

COPY package*.json ./
RUN npm install

COPY . .

# (Optional) Compile contracts on build
RUN npx hardhat compile

CMD ["npx", "hardhat", "node"]
