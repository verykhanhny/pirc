# Use an official Node runtime as a base image
FROM node:18.19.0 AS build

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the application files to the container
COPY . .

# Install the app dependencies
RUN npm ci --only=production

CMD ["npm", "start"]