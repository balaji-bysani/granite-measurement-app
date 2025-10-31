#!/bin/bash

echo "🚀 Granite Measurement App - Deployment Helper"
echo "=============================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
else
    echo "📝 Adding changes to Git..."
    git add .
    echo "Enter commit message (or press Enter for default):"
    read commit_message
    if [ -z "$commit_message" ]; then
        commit_message="Update for deployment"
    fi
    git commit -m "$commit_message"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Create a GitHub repository at: https://github.com/new"
echo "2. Name it: granite-measurement-app"
echo "3. Run these commands:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/granite-measurement-app.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "4. Then follow the DEPLOYMENT.md guide for Vercel + Supabase setup"
echo ""
echo "✅ Code is ready for deployment!"