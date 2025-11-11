# 🍎 MacBook M1 Pro Setup Guide

Complete setup guide for running Omega-Core on MacBook M1 Pro with ARM64 optimizations.

## Prerequisites

### 1. Install Homebrew (if not already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js (ARM64 native)
```bash
# Using Homebrew (recommended for M1)
brew install node@20

# Or use nvm for version management
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### 3. Install pnpm (ARM64 native)
```bash
brew install pnpm
# Or
npm install -g pnpm
```

### 4. Install PostgreSQL (ARM64 native)
```bash
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb omega_core
```

### 5. Enable pgvector Extension
```bash
# Connect to your database
psql omega_core

# Install pgvector
CREATE EXTENSION IF NOT EXISTS vector;

# Verify installation
\dx vector
```

## Quick Setup Script

Run this one-command setup (after Homebrew is installed):

```bash
curl -fsSL https://raw.githubusercontent.com/abelxmendoza/OmegaCore-Chatbot2.0/main/scripts/m1-setup.sh | bash
```

Or manually:

```bash
# 1. Clone repository
git clone https://github.com/abelxmendoza/OmegaCore-Chatbot2.0.git
cd OmegaCore-Chatbot2.0

# 2. Install dependencies (ARM64 optimized)
pnpm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Configure environment variables (see below)
nano .env.local

# 5. Run database migrations
pnpm db:migrate

# 6. Start development server
pnpm dev
```

## Environment Variables (.env.local)

**⚠️ NEVER commit .env.local to Git - it's already in .gitignore**

```bash
# Database (Local PostgreSQL)
POSTGRES_URL=postgresql://localhost:5432/omega_core

# Authentication
AUTH_SECRET=your-secret-here-generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
AUTH_URL=http://localhost:3000/

# OpenAI (Required)
OPENAI_API_KEY=sk-your-key-here

# Optional: xAI (for Grok models)
XAI_API_KEY=your-xai-key

# Optional: Anthropic (for Claude models)
ANTHROPIC_API_KEY=sk-ant-your-key

# Optional: Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com

# Optional: Calendar
GOOGLE_CALENDAR_ID=your-calendar-id
GOOGLE_CREDENTIALS=path-to-credentials.json

# Optional: Shell execution (NOT recommended for production)
ENABLE_SHELL_TOOL=false

# M1 Pro Optimizations
NODE_OPTIONS="--max-old-space-size=4096"
```

## M1 Pro Specific Optimizations

### 1. Native ARM64 Builds
All dependencies are automatically built for ARM64. If you encounter issues:

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 2. Memory Optimization
M1 Pro has unified memory. Optimize Node.js:

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 3. Database Performance
For local development, PostgreSQL runs natively on ARM64. Optimize:

```sql
-- In psql
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';
SELECT pg_reload_conf();
```

### 4. Vector Search Performance
pgvector is optimized for M1 Pro's unified memory architecture. The system automatically:
- Uses IVFFlat index for fast approximate search
- Batches embedding generation
- Caches frequently accessed memories

## Performance Tips

1. **Use Turbo Mode**: Next.js Turbo is enabled by default
2. **Enable SWC**: Already configured for fast compilation
3. **Database Indexing**: All tables are properly indexed
4. **Vector Search**: Uses cosine similarity with IVFFlat index

## Troubleshooting

### Issue: "Module not found" or build errors
```bash
# Clear all caches
rm -rf .next node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### Issue: PostgreSQL connection failed
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start if not running
brew services start postgresql@15

# Check connection
psql -d omega_core -c "SELECT version();"
```

### Issue: pgvector extension not found
```bash
# Install via Homebrew
brew install pgvector

# Or compile from source
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector
make
make install
```

### Issue: Slow vector search
```bash
# Rebuild index with more lists (for larger datasets)
# In psql:
DROP INDEX IF EXISTS "Memory_embedding_idx";
CREATE INDEX "Memory_embedding_idx" ON "Memory" 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## Development Workflow

```bash
# Start development server (with Turbo)
pnpm dev

# Run database migrations
pnpm db:migrate

# Open database studio
pnpm db:studio

# Run linter
pnpm lint

# Build for production
pnpm build
```

## Production Deployment

For production on M1 Pro (or any server):

1. Use Vercel (recommended) - automatically handles ARM64
2. Or self-host with Docker (ARM64 images available)
3. Use Supabase for managed PostgreSQL with pgvector

## Security Notes

- ✅ `.env.local` is in `.gitignore` - never committed
- ✅ All API keys stored as environment variables
- ✅ Database credentials never in code
- ✅ Shell tool disabled by default in production
- ✅ Vector embeddings don't expose sensitive data

## Next Steps

1. ✅ Complete setup above
2. ✅ Configure `.env.local` with your keys
3. ✅ Run `pnpm db:migrate`
4. ✅ Start with `pnpm dev`
5. ✅ Visit `http://localhost:3000`

Enjoy your high-performance AI assistant! 🚀

