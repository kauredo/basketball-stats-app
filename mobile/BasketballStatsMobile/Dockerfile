FROM node:18-alpine

WORKDIR /app

# Install Expo CLI globally
RUN npm install -g expo-cli

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Create a symlink to the shared library
RUN mkdir -p /app/node_modules/@basketball-stats
RUN ln -s /shared /app/node_modules/@basketball-stats/shared

# Expose ports for Expo
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Start Expo
CMD ["npm", "start"]
