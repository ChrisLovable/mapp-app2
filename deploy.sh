#!/bin/bash

# Build the project
echo "Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Built files are in the 'dist' folder"
    echo ""
    echo "🌐 To deploy with HTTPS, you can:"
    echo "1. Upload the 'dist' folder to Netlify (drag & drop)"
    echo "2. Upload to Vercel (drag & drop)"
    echo "3. Upload to GitHub Pages"
    echo "4. Use any static hosting service"
    echo ""
    echo "🔗 Your app will get HTTPS automatically!"
    echo "🎤 The red microphone button will work on mobile!"
else
    echo "❌ Build failed!"
    exit 1
fi 