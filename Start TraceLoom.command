#!/bin/bash

# Go to the traceloom-web folder (works wherever this file is located)
cd "$(dirname "$0")"

echo "🧵 Starting TraceLoom..."
echo ""

# Start the dev server in the background
npm run dev &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
sleep 5

# Open the browser
echo "🌐 Opening TraceLoom in your browser..."
open http://localhost:3000/login

echo ""
echo "✅ TraceLoom is running!"
echo "   Go to: http://localhost:3000/login"
echo ""
echo "   To stop the server, close this window."
echo ""

# Keep the terminal open and wait for the server
wait $SERVER_PID
