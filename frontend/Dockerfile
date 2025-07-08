# 1. Use official Node.js image
FROM node:18-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files and install deps
COPY package*.json ./
RUN npm install

# 4. Copy rest of app
COPY . .

# 5. Build and expose port
RUN npm run build

EXPOSE 3000

# 6. Run Next.js
CMD ["npm", "start"]
