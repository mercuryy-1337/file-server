#!/bin/bash

# Build the application
echo "Building the application..."
npm run build

# Create the standalone directory if it doesn't exist
mkdir -p .next/standalone/public

# Copy the public directory to the standalone directory
echo "Copying public files..."
cp -r public .next/standalone/

# Start the server
echo "Starting the server..."
node .next/standalone/server.js
