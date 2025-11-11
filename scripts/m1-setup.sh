#!/bin/bash

# Omega-Core M1 Pro Setup Script
# This script sets up the development environment for MacBook M1 Pro

set -e

echo "🚀 Omega-Core M1 Pro Setup"
echo "=========================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is designed for macOS. Exiting."
    exit 1
fi

# Check for M1/M2 chip
ARCH=$(uname -m)
if [[ "$ARCH" != "arm64" ]]; then
    echo "⚠️  Warning: Not running on ARM64 (M1/M2). Some optimizations may not apply."
fi

echo "📦 Step 1: Installing Homebrew (if not installed)..."
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "✅ Homebrew already installed"
fi

echo ""
echo "📦 Step 2: Installing Node.js (ARM64 native)..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js via Homebrew..."
    brew install node@20
    echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
    export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
else
    echo "✅ Node.js already installed: $(node --version)"
fi

echo ""
echo "📦 Step 3: Installing pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
else
    echo "✅ pnpm already installed: $(pnpm --version)"
fi

echo ""
echo "📦 Step 4: Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    brew install postgresql@15
    brew services start postgresql@15
    sleep 2
else
    echo "✅ PostgreSQL already installed"
    # Ensure it's running
    brew services start postgresql@15 || true
fi

echo ""
echo "📦 Step 5: Creating database..."
if psql -lqt | cut -d \| -f 1 | grep -qw omega_core; then
    echo "✅ Database 'omega_core' already exists"
else
    echo "Creating database 'omega_core'..."
    createdb omega_core
    echo "✅ Database created"
fi

echo ""
echo "📦 Step 6: Installing pgvector extension..."
psql omega_core -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || {
    echo "⚠️  pgvector extension not found. Installing..."
    brew install pgvector || {
        echo "⚠️  Could not install pgvector via Homebrew."
        echo "   You may need to install it manually or use Supabase."
    }
}

echo ""
echo "📦 Step 7: Installing project dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Running pnpm install..."
    pnpm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "📦 Step 8: Setting up environment variables..."
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo "✅ Created .env.local from .env.example"
        echo "⚠️  Please edit .env.local with your API keys and configuration"
    else
        echo "⚠️  .env.example not found. Creating basic .env.local..."
        cat > .env.local << EOF
# Database
POSTGRES_URL=postgresql://localhost:5432/omega_core

# Authentication (generate with: openssl rand -base64 32)
AUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
AUTH_URL=http://localhost:3000/

# OpenAI (Required)
OPENAI_API_KEY=your-openai-key-here

# Optional
# XAI_API_KEY=your-xai-key
# ANTHROPIC_API_KEY=sk-ant-your-key
EOF
        echo "✅ Created basic .env.local"
        echo "⚠️  Please edit .env.local with your API keys"
    fi
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "📦 Step 9: Running database migrations..."
if [ -f "lib/db/migrate.ts" ]; then
    pnpm db:migrate || {
        echo "⚠️  Migration failed. This is okay if the database is already set up."
    }
else
    echo "⚠️  Migration script not found"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Edit .env.local with your API keys"
echo "   2. Run: pnpm dev"
echo "   3. Visit: http://localhost:3000"
echo ""
echo "🚀 Happy coding!"

