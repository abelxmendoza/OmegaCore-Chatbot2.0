# OMEGA-CORE A.I.

> **High Voltage, Post-Human Precision.**

A cutting-edge AI chatbot platform built with Next.js and the AI SDK, designed for security researchers, penetration testers, and cybersecurity professionals. Omega-Core features a dark cyberpunk aesthetic with purple neon accents and supports multiple LLM providers optimized for security research.

![Omega-Core Theme](https://img.shields.io/badge/Theme-Cyberpunk-purple?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)

## 🎯 Features

### Core Capabilities
- **Multi-Provider LLM Support**: OpenAI GPT-4, xAI Grok, and Anthropic Claude models
- **Security Research Focus**: Optimized prompts and model selection for penetration testing and cybersecurity research
- **Cyberpunk UI**: Dark theme with purple neon accents, circuitry textures, and particle animations
- **Real-time Streaming**: Fast, responsive chat experience with streaming responses
- **Chat History**: Persistent conversation history with search and organization
- **File Uploads**: Support for document analysis and processing
- **Artifact Generation**: Code, documents, and spreadsheet creation tools
- **Web Browsing**: Fetch and extract content from web pages for research and information gathering
- **Shell Execution**: Controlled shell command execution with security safeguards (disabled in production by default)
- **Persistent Memory**: Vector database-powered memory system that remembers context across conversations
- **Memory Management**: Remember, forget, and search through stored memories
- **Email Integration**: Send emails directly from the chat interface
- **Calendar Integration**: Create and manage calendar events
- **Command Palette**: Quick access to tools and commands (⌘K)

### LLM Providers

#### OpenAI (Default)
- GPT-4 - Primary chat model
- GPT-4 Reasoning - Advanced reasoning capabilities

#### xAI Grok (Recommended for Security Research)
- Grok Beta - More permissive for security research
- Grok-2 - Latest model
- Grok-2 Vision - Vision-capable version

#### Anthropic Claude (Optional)
- Claude 3.5 Sonnet - Excellent for technical security discussions
- Claude 3 Opus - Most capable for complex analysis
- Claude 3 Sonnet - Balanced performance
- Claude 3 Haiku - Fast and affordable

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (ARM64 native for M1 Pro)
- pnpm (recommended) or npm
- PostgreSQL database (with pgvector extension)
- API keys for your chosen LLM providers

### 🍎 MacBook M1 Pro Users
See [M1_PRO_SETUP.md](./M1_PRO_SETUP.md) for optimized setup instructions and one-command installation.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/abelxmendoza/OmegaCore-Chatbot2.0.git
   cd OmegaCore-Chatbot2.0
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file with the following:
   ```env
   # Authentication
   AUTH_SECRET=your-random-secret-here
   NEXTAUTH_SECRET=your-random-secret-here
   
   # Database
   POSTGRES_URL=your-postgres-connection-string
   
   # OpenAI (Required for GPT-4)
   OPENAI_API_KEY=sk-...
   
   # xAI (Optional - for Grok models)
   XAI_API_KEY=your-xai-key
   
   # Anthropic (Optional - for Claude models)
   ANTHROPIC_API_KEY=sk-ant-...
   
   # Vercel Blob Storage (Optional - for file uploads)
   BLOB_READ_WRITE_TOKEN=vercel_blob_...
   
   # Shell Execution (Optional - NOT recommended for production)
   # Set to 'true' to enable shell execution tool in production
   # WARNING: Only enable if you understand the security implications
   ENABLE_SHELL_TOOL=false
   ```

4. **Run database migrations**
   ```bash
   pnpm db:migrate
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎨 Theme Customization

Omega-Core features a custom cyberpunk theme with the following color palette:

- **Background**: `#060606` (Matte black)
- **Panels**: `#0b0b10` (Dark purple-tinted)
- **Primary Accent**: `#9b00ff` (Neon purple)
- **Text**: `#d8d6e4` (Light metallic gray)
- **Fonts**: JetBrains Mono, Orbitron

The theme includes:
- Animated background with purple glow effects
- Circuitry texture overlay
- Neon purple button gradients
- Smooth hover animations

## 🔧 Configuration

### Model Selection

Models are configured in `lib/ai/models.ts` and entitlements in `lib/ai/entitlements.ts`. 

**Guest users** can access:
- GPT-4 models
- Grok Beta
- Claude 3 Haiku

**Registered users** have access to all models including premium options.

### Security Research Prompts

The system prompts are optimized for security research and can be customized in `lib/ai/prompts.ts`. The default prompt emphasizes:
- Ethical hacking and penetration testing
- Security vulnerability analysis
- Tool development for security research
- Educational security content

## 📦 Tech Stack

- **Framework**: Next.js 15.3 (App Router, Turbo mode)
- **Language**: TypeScript
- **AI SDK**: AI SDK v4.3
- **Database**: PostgreSQL with Drizzle ORM + pgvector
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS with custom cyberpunk theme
- **UI Components**: Radix UI
- **Fonts**: JetBrains Mono, Orbitron, Geist
- **Performance**: LRU Cache, Token Bucket Rate Limiting, Vector Indexing

### 🚀 Performance Optimizations
- **LRU Cache**: O(1) embedding and query caching
- **Token Bucket Rate Limiting**: O(1) rate limit checks
- **Vector Indexing**: O(log n) similarity search with IVFFlat
- **Batch Processing**: Optimized embedding generation
- **Database Indexing**: Optimized queries with composite indexes

See [OPTIMIZATION_GUIDE.md](./OPTIMIZATION_GUIDE.md) for detailed performance documentation.

## 🚢 Deployment

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `AUTH_SECRET` - Generate at https://generate-secret.vercel.app/32
   - `POSTGRES_URL` - Your PostgreSQL connection string
   - `OPENAI_API_KEY` - Required
   - `XAI_API_KEY` - Optional (for Grok)
   - `ANTHROPIC_API_KEY` - Optional (for Claude)
   - `BLOB_READ_WRITE_TOKEN` - Optional (for file uploads, if using Vercel Blob)

3. Deploy!

### Manual Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 🛠️ Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start         # Start production server
pnpm lint          # Run linter
pnpm db:migrate    # Run database migrations
pnpm db:studio     # Open Drizzle Studio
```

### Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (chat)/            # Chat interface and API routes
│   └── layout.tsx         # Root layout with theme
├── components/            # React components
│   ├── chat-header.tsx    # Header with Omega-Core branding
│   └── app-sidebar.tsx    # Sidebar with branding
├── lib/
│   ├── ai/                # AI provider configuration
│   │   ├── providers.ts   # Multi-provider setup
│   │   ├── models.ts      # Available models
│   │   ├── prompts.ts    # System prompts
│   │   └── tools/        # AI tools (calculator, weather, web browser, shell, etc.)
│   └── db/               # Database queries and schema
└── types/                 # TypeScript type definitions
```

## 🔐 Security & Privacy

- All API keys are stored securely as environment variables
- User authentication via NextAuth.js with JWT sessions
- Database connections use SSL
- Guest mode available for anonymous usage
- Rate limiting per user type

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- Built with [AI SDK](https://sdk.vercel.ai) for LLM integration
- UI components from [Radix UI](https://www.radix-ui.com)
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Framework: [Next.js](https://nextjs.org)

---

**Omega-Core A.I.** - *High Voltage, Post-Human Precision.*

For questions or support, open an issue on GitHub.
