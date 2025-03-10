# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install -g nodemon && npm install

# Copy the rest of your application
COPY . .

# Expose port 2888
EXPOSE 2888

# Start the application with nodemon for live reloading
CMD ["nodemon", "src/app.js"]
