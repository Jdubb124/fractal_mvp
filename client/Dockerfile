FROM node:18-alpine

WORKDIR /app

# Install Angular CLI globally
RUN npm install -g @angular/cli@17

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 4200

# Start the development server
CMD ["ng", "serve", "--host", "0.0.0.0"]