FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript (for production)
RUN npm run build || true

EXPOSE 3001

# Default command for development
CMD ["npm", "run", "dev"]
