#!/bin/bash

# Student Enrollment System - Development Helper Script
# This script provides quick commands for common development tasks

set -e

case "$1" in
  "dev")
    echo "🚀 Starting development server..."
    npm run start:dev
    ;;
  "setup")
    echo "🛠️  Setting up database and dependencies..."
    npm install
    ./setup.sh
    echo "✅ Setup complete! Run 'npm run start:dev' to start the server"
    ;;
  "reset")
    echo "🔄 Resetting database..."
    ./reset.sh
    echo "✅ Database reset complete!"
    ;;
  "build")
    echo "🏗️  Building for production..."
    npm run build
    echo "✅ Build complete!"
    ;;
  "test")
    echo "🧪 Running tests..."
    npm run test
    ;;
  "lint")
    echo "🔍 Linting code..."
    npm run lint
    echo "✅ Linting complete!"
    ;;
  "docs")
    echo "📚 API documentation available at: http://localhost:3001/api"
    echo "📖 Make sure the server is running first!"
    ;;
  "clean")
    echo "🧹 Cleaning build artifacts..."
    rm -rf dist/ node_modules/.cache/ coverage/
    echo "✅ Clean complete!"
    ;;
  *)
    echo "📋 Student Enrollment System - Development Helper"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup    - Install dependencies and setup database"
    echo "  dev      - Start development server"
    echo "  reset    - Reset database to clean state"
    echo "  build    - Build for production"
    echo "  test     - Run tests"
    echo "  lint     - Lint code"
    echo "  docs     - Show API documentation URL"
    echo "  clean    - Clean build artifacts"
    echo ""
    echo "Quick start: ./dev.sh setup && ./dev.sh dev"
    ;;
esac
