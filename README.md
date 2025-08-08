# Pixell Agent Framework

A modern, production-ready multi-agent framework that combines a TypeScript/Next.js frontend with a Python-based cognitive engine. Build intelligent agent systems with minimal setup and enterprise-grade service orchestration.

## 🎯 Project Overview

### Architecture

Pixell Agent Framework is a **hybrid multi-language system** designed for building sophisticated AI agent applications:

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Web Frontend      │    │   Orchestrator       │    │  PAF Core Agent     │
│   (Next.js 15)      │◄───┤   (Node.js/TS)      │◄───┤   (Python UPEE)     │
│                     │    │                      │    │                     │
│ • React 19          │    │ • Agent Management   │    │ • Cognitive Loop    │
│ • Real-time UI      │    │ • File Storage       │    │ • Multi-LLM Support │
│ • File Management   │    │ • API Gateway        │    │ • Streaming Responses│
│ • Chat Interface    │    │ • WebSocket Hub      │    │ • Context Management│
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
           │                           │                           │
           └─────────────────────────────────────────────────────┘
                                    │
                    ┌─────────────────────────────────┐
                    │        Supabase Stack          │
                    │                                 │
                    │ • PostgreSQL Database          │
                    │ • Real-time Subscriptions      │
                    │ • Authentication & Storage     │
                    │ • REST API & Admin UI          │
                    └─────────────────────────────────┘
```

### Core Components

1. **Web Frontend** (`apps/web/`)
   - **Next.js 15** with React 19 and TypeScript
   - Real-time chat interface with streaming responses
   - File upload, management, and context display
   - Agent activity monitoring and task visualization

2. **Orchestrator** (`apps/orchestrator/`)
   - **Node.js/TypeScript** API gateway and coordination layer
   - Environment management and configuration
   - File storage abstraction (local, S3, Supabase)
   - WebSocket management for real-time updates

3. **PAF Core Agent** (separate repository - auto-cloned)
   - **Python 3.11+** microservice with FastAPI
   - **UPEE Cognitive Loop**: Understand → Plan → Execute → Evaluate
   - Multi-provider LLM support (OpenAI, Anthropic, AWS Bedrock)
   - Server-Sent Events (SSE) for streaming responses

4. **Supabase Stack** (containerized)
   - **PostgreSQL** database with real-time capabilities
   - **Authentication** and user management
   - **File storage** with CDN and image processing
   - **Admin interface** for database management

### Key Features

- 🚀 **One-Command Setup** - Complete environment ready in minutes
- 🔄 **Real-time Everything** - Live updates, streaming responses, collaborative editing
- 🧠 **Multi-LLM Support** - OpenAI, Anthropic Claude, AWS Bedrock
- 📁 **Intelligent File Management** - Context-aware file processing and search
- 🐳 **Docker Orchestration** - All services containerized and health-monitored
- 🌍 **Multi-Environment** - Local, development, staging, production configs
- 🔧 **Enterprise-Ready** - Health checks, logging, metrics, scalability

## 🚀 Quick Start (2 Steps)

### Prerequisites

The setup will automatically check and install these dependencies:

- **Node.js 18.18.0+** (required)
- **Docker** (auto-installed if missing)
- **Python 3.11+** (auto-installed if missing)
- **Git** (auto-installed if missing)

### Step 1: Clone and Setup

```bash
git clone https://github.com/pixell-global/pixell-agent-framework
cd pixell-agent-framework
npm run setup:complete
```

**That's it!** This single command will:

✅ Check and install all system dependencies (Docker, Python, Git)  
✅ Install Node.js dependencies and build packages  
✅ Clone the PAF Core Agent Python repository  
✅ Set up Python virtual environment with dependencies  
✅ Configure Docker environment with all services  
✅ Create 4 default environments (local, dev, staging, prod)  
✅ Initialize Supabase database with proper configuration  
✅ Prompt for AI provider API keys (OpenAI, Anthropic, etc.)
✅ Create both `.env.local` and `.env` files for seamless integration

### Step 2: Start Development

After setup completes, you have flexible options for starting services:

#### Option A: Start Frontend & Backend Only (Recommended for UI Development)
```bash
pxui start
```

This starts:
- **🌐 Web Interface**: http://localhost:3003
- **🔗 API Gateway**: http://localhost:3001  
- **🗄️ Database Admin**: http://localhost:54323

#### Option B: Start PAF Core Agent Only (For AI/Backend Development)
```bash
pxui start core-agent
```

This starts:
- **🧠 PAF Core Agent**: http://localhost:8000
- **📚 API Documentation**: http://localhost:8000/docs
- **🏥 Health Check**: http://localhost:8000/api/health

#### Option C: Start Everything Together
```bash
# Terminal 1: Start frontend/backend
pxui start

# Terminal 2: Start PAF Core Agent
pxui start core-agent
```

**Alternative**: For manual control:
```bash
npm run dev  # Start frontend/backend only
```

### Step 3: Configure AI Providers

The framework supports multiple AI providers for maximum flexibility. You can configure them during setup or later:

#### Option 1: During Complete Setup
The `npm run setup:complete` command automatically prompts for your OpenAI API key and creates both `.env.local` and `.env` files for seamless integration.

#### Option 2: Configure AI Separately
You can configure AI providers anytime using the dedicated command:

```bash
pxui config ai
```

This interactive setup allows you to:
- **Quick Setup**: Configure OpenAI only (recommended for beginners)
- **Advanced Setup**: Configure multiple providers (OpenAI, Anthropic, AWS Bedrock, etc.)
- **Manage Providers**: Update existing configurations

**Supported Providers:**
- 🧠 **OpenAI** - GPT-4o, GPT-4o Mini, o1 models
- 🎭 **Anthropic** - Claude 3.5 Sonnet, Haiku
- 🏗️ **AWS Bedrock** - Multiple models via AWS
- ☁️ **Azure OpenAI** - Enterprise GPT models
- 🔍 **Google** - Gemini 1.5 Pro

The configuration automatically creates:
- `.env.local` - For local development and frontend
- `.env` - For Docker Compose services

## 🛠️ How Setup Actually Works

Understanding the setup process helps with troubleshooting and customization:

### Phase 1: System Dependencies (Auto-Detection & Installation)

```bash
# The setup checks and installs these automatically:

🐳 Docker
   ✓ Checks: docker --version
   ✓ Verifies running: docker ps
   ✓ Auto-installs via: Homebrew/Chocolatey/package managers
   ✓ Starts if not running

🐍 Python 3.11+
   ✓ Checks: python3 --version (validates ≥3.11)
   ✓ Verifies venv: python3 -m venv --help
   ✓ Auto-installs via: System package managers

🔧 Git, curl, Node.js
   ✓ Validates versions and installs if missing
```

### Phase 2: Repository and Environment Setup

```bash
# PAF Core Agent Integration
git clone https://github.com/pixell-global/paf-core-agent.git
cd paf-core-agent
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Environment Configuration
.pixell/environments.json  # 4 environments created
├── local (active)         # http://localhost:8000
├── development           # http://localhost:8001  
├── staging              # https://your-staging.com
└── production           # https://your-production.com
```

### Phase 3: Service Orchestration

```yaml
# docker-compose.yml creates these services:
services:
  paf-core-agent:    # Python UPEE microservice (port 8000)
  supabase-db:       # PostgreSQL database (port 54322)
  supabase-rest:     # REST API (port 54321)
  supabase-studio:   # Admin UI (port 54323)
  supabase-auth:     # Authentication (port 54324)
  supabase-storage:  # File storage (port 54325)
  supabase-realtime: # WebSocket subscriptions (port 54326)
```

### Phase 4: Health Validation

```bash
# Automatic health checks verify:
✓ curl http://localhost:8000/api/health     # PAF Core Agent
✓ curl http://localhost:54321/rest/v1/      # Supabase REST  
✓ curl http://localhost:54323               # Supabase Studio
✓ All Docker containers running and healthy
```

## 🚨 Troubleshooting Setup Issues

### Common Issues and Solutions

#### **Issue: Docker Not Found**
```bash
# Symptoms
❌ Docker is not installed

# Solution 1: Auto-install (recommended)
npm run install-deps

# Solution 2: Manual install
# macOS: brew install --cask docker
# Windows: Download from https://desktop.docker.com/
# Linux: curl -fsSL https://get.docker.com | sh
```

#### **Issue: Docker Not Running**
```bash
# Symptoms  
⚠️ Docker is installed but not running

# Solution
# macOS/Windows: Open Docker Desktop
# Linux: sudo systemctl start docker

# Verify
docker ps
```

#### **Issue: Python Version Too Old**
```bash
# Symptoms
❌ Python 3.8 found, but 3.11+ is required

# Solution
# macOS: brew install python@3.11
# Ubuntu: sudo apt install python3.11 python3.11-venv
# Windows: Download from python.org

# Verify
python3 --version  # Should show 3.11+
```

#### **Issue: Python venv Module Missing**
```bash
# Symptoms
❌ Python venv module is not available

# Solution  
# Ubuntu/Debian: sudo apt install python3-venv
# CentOS/RHEL: sudo yum install python3-venv

# Verify
python3 -m venv --help
```

#### **Issue: Port Conflicts**
```bash
# Symptoms
Error: listen EADDRINUSE: address already in use :::8000

# Solution 1: Kill conflicting processes
lsof -ti:8000 | xargs kill -9

# Solution 2: Change ports in docker-compose.yml
paf-core-agent:
  ports:
    - "8001:8000"  # Changed from 8000:8000
```

#### **Issue: Supabase Setup Failed**
```bash
# Symptoms
❌ Failed to initialize Supabase

# Solution
# Check Docker is running
docker ps

# Restart Supabase services
docker-compose restart supabase-db supabase-rest

# Reset and reinitialize
pixell supabase reset
pixell supabase init
```

### Manual Setup (If Automatic Setup Fails)

If the automatic setup fails, you can set up manually:

#### **1. System Dependencies**
```bash
# Check what's missing
npm run check-deps

# Install Docker manually
# macOS: brew install --cask docker
# Windows: https://desktop.docker.com/
# Linux: curl -fsSL https://get.docker.com | sh

# Install Python 3.11+
# macOS: brew install python@3.11  
# Linux: sudo apt install python3.11 python3.11-venv
# Windows: https://python.org/downloads/
```

#### **2. Node.js Setup**
```bash
npm install
npm run build
cd packages/cli && npm link
```

#### **3. PAF Core Agent Setup**
```bash
# Clone repository
git clone https://github.com/pixell-global/paf-core-agent.git
cd paf-core-agent

# Setup Python environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your API keys
```

#### **4. Environment Configuration**
```bash
# Create environments
pixell env

# Initialize Supabase  
pixell supabase init

# Configure AI
pixell config ai
```

#### **5. Start Services**
```bash
# Start all Docker services
docker-compose up -d

# Check health
pixell services status

# Start main applications  
npm run dev
```

### Diagnostic Commands

```bash
# Check system dependencies
npm run check-deps
pixell check-deps

# Check individual components
pixell docker status        # Docker installation and status
pixell paf status          # PAF Core Agent repository and Python env
pixell services status     # All Docker services health
pixell supabase status     # Database status

# View logs
docker-compose logs -f                    # All services
docker-compose logs -f paf-core-agent    # Specific service  
pixell services logs --follow            # Via CLI

# Reset everything
docker-compose down --volumes   # Stop and remove all data
rm -rf paf-core-agent          # Remove PAF Core Agent
npm run setup:complete         # Start fresh
```

## 🔧 Development Workflow

### Daily Development

```bash
# Check everything is healthy
pixell services status

# Start services based on your development needs:

# Frontend/UI Development (most common)
pixell start

# AI/Backend Development
pixell start core-agent

# Full-stack development (run in separate terminals)
pixell start             # Terminal 1: Frontend & API
pixell start core-agent  # Terminal 2: AI Agent

# Access services
open http://localhost:3003       # Web interface
open http://localhost:3001       # API Gateway
open http://localhost:8000/docs  # PAF Core Agent API docs
open http://localhost:54323      # Database admin
```

### AI Configuration Management

```bash
# Configure AI providers interactively
pixell config ai

# Quick OpenAI setup
echo -e "quick\nyour-api-key\ngpt-4o" | pixell config ai

# Check current configuration
pixell config show

# Update API keys in existing setup
pixell config ai  # Choose "Manage Existing Providers"

# Verify Docker can read API keys
docker compose config | grep API_KEY
```

### Working with PAF Core Agent

```bash
# Update PAF Core Agent
pixell paf update

# Check Python environment
pixell paf status

# Activate Python environment manually
cd paf-core-agent
source venv/bin/activate  # Windows: venv\Scripts\activate

# Run PAF Core Agent directly (for debugging)
cd paf-core-agent
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Service Management

```bash
# Start/stop specific services
docker-compose up -d paf-core-agent supabase-db
docker-compose stop paf-core-agent

# Scale services
pixell services scale paf-core-agent 3

# View real-time logs
pixell services logs --follow --service paf-core-agent

# Restart all services
pixell services restart
```

### Environment Management

```bash
# Switch environments
pixell env

# Check current environment
pixell config show

# Start with specific environment
pixell start --env development
```

## 📊 Service Architecture Details

### Service Communication

```
Web App (3003) → Orchestrator (3001) → PAF Core Agent (8000)
       ↓                ↓                        ↓
   Supabase (54321) ←  Files & DB  →  Real-time Updates
```

### Data Flow

1. **User Interaction** → Web interface captures input and files
2. **File Processing** → Orchestrator handles file storage and context
3. **Agent Communication** → Orchestrator sends requests to PAF Core Agent
4. **UPEE Loop** → PAF Core Agent processes with Understand→Plan→Execute→Evaluate
5. **Streaming Response** → Server-Sent Events stream back to web interface
6. **Real-time Updates** → Supabase propagates changes across all clients

### Configuration Files

```
pixell-agent-framework/
├── .env.local                    # Main environment variables
├── .pixell/environments.json     # Environment configurations
├── docker-compose.yml           # Production service orchestration  
├── docker-compose.dev.yml       # Development overrides
├── supabase/config.toml         # Database configuration
├── paf-core-agent/
│   ├── .env                     # Python service config
│   ├── requirements.txt         # Python dependencies
│   └── venv/                    # Python virtual environment
└── apps/
    ├── web/.env.local          # Frontend-specific config
    └── orchestrator/           # Backend configuration
```

## 🌟 What Makes This Different

- **Hybrid Architecture**: Combines TypeScript's ecosystem with Python's AI capabilities
- **Zero-Config Setup**: Handles system dependencies, repositories, and services automatically  
- **Production-Ready**: Docker orchestration, health monitoring, multi-environment support
- **Developer-Friendly**: Comprehensive CLI, detailed error messages, manual fallback options
- **Enterprise-Grade**: Real-time updates, scalability, observability, security

The Pixell Agent Framework eliminates the complexity of setting up a modern AI agent system while maintaining the flexibility and power needed for production applications.

---

**🚀 Ready to build intelligent agents?**

```bash
git clone https://github.com/pixell-global/pixell-agent-framework
cd pixell-agent-framework  
npm run setup:complete
```

Your complete AI agent development environment will be ready in minutes!