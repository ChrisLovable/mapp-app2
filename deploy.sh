#!/bin/bash

echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Check if Vercel CLI is installed
    if command -v vercel &> /dev/null; then
        echo "🚀 Deploying to Vercel..."
        vercel --prod
    else
        echo "⚠️  Vercel CLI not found. Please install it with: npm i -g vercel"
        echo "📋 Manual deployment steps:"
        echo "1. Push to GitHub: git add . && git commit -m 'Deploy' && git push"
        echo "2. Go to vercel.com and import your repository"
    fi
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi 