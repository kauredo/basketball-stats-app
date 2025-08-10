FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Create a symlink to the shared library
RUN mkdir -p /app/node_modules/@basketball-stats
RUN ln -s /shared /app/node_modules/@basketball-stats/shared

# Expose port
EXPOSE 3001

# Start the app
CMD ["npm", "start"]
