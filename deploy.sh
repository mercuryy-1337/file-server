#!/bin/bash

# Build the application
echo "Building the application..."
npm run build

# Create the standalone directory if it doesn't exist
mkdir -p .next/standalone/public

# Copy the public directory to the standalone directory
echo "Copying public files..."
cp -r public .next/standalone/

# Copy our custom server to the standalone directory
echo "Copying custom server..."
cp server.js .next/standalone/

# Start the server
echo "Starting the server..."
cd .next/standalone
node server.js
