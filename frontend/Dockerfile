FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build Next.js app
ENV NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
