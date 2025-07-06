# ChatGPT-Buddy Quick Start Guide

🚀 **Get up and running with ChatGPT-Buddy in 5 minutes**

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **pnpm 8+** - Install with `npm install -g pnpm`
- **Chrome/Edge Browser** - For the browser extension

## Installation

### 1. Clone and Install
```bash
# Clone the repository
git clone https://github.com/rydnr/chatgpt-buddy.git
cd chatgpt-buddy

# Install all workspace dependencies
pnpm install
```

> ⚠️ **Important**: This project uses **pnpm workspaces**. Always use `pnpm` commands, not `npm` commands.

### 2. Set Up Environment (Optional)

Create a `.env` file in the `server/` directory for AI features:

```bash
# AI API Keys (optional for development)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Development

### 3. Start Development Server
```bash
# Start the development server
pnpm run dev
```

✅ **Success!** The server will start on `http://localhost:3000`

**Available endpoints:**
- `GET /health` - Health check
- `POST /api/dispatch` - API dispatch for browser extension
- `POST /api/training/enable` - Enable training mode  
- `GET /api/training/patterns` - Get training patterns

### 4. Test the Server
```bash
# Test health endpoint
curl http://localhost:3000/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-07-05T15:45:00.000Z",
  "service": "chatgpt-buddy-server",
  "version": "2.0.0"
}
```

## Browser Extension (Optional)

### 5. Extension Status (Optional)

> ⚠️ **Note**: Browser extension build currently has dependency issues.

For development and testing, the API server provides full functionality:
```bash
# Test API endpoints directly
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/dispatch -d '{"test":"data"}' -H "Content-Type: application/json"
```

**If you want to try building the extension:**
```bash
cd web-buddy && pnpm run build
# Then attempt to load from extension/ directory in Chrome
```

## Testing and Development

### 6. Run Tests
```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm run test:unit        # Unit tests only
pnpm run test:integration # Integration tests only
pnpm run test:e2e        # End-to-end tests
```

### 7. Linting and Type Checking
```bash
# Lint all packages
pnpm run lint

# Type check all packages  
pnpm run typecheck
```

### 8. Build Status
```bash
# ⚠️ Note: Full workspace build currently has dependency issues
# Use this for development:
pnpm run dev  # ✅ Always works

# Build individual working packages:
cd web-buddy && pnpm run build  # ✅ Works

# For details, see BUILD_STATUS.md
```

## 📁 Project Structure

This is a **pnpm workspace** with the following packages:

```
chatgpt-buddy/
├── server/                 # Node.js API server
├── extension/             # Browser extension  
├── client/               # TypeScript client SDK
├── web-buddy/           # Web automation framework
├── typescript-eda/     # Event-driven architecture
└── docs/               # Documentation
```

## 📝 Quick Commands Reference

| Command | Status | Description |
|---------|--------|-------------|
| `pnpm install` | ✅ | Install all dependencies |
| `pnpm run dev` | ✅ | Start development server |
| `pnpm run build` | ⚠️ | Build command (has issues, see BUILD_STATUS.md) |
| `pnpm test` | ✅ | Run all tests |
| `cd web-buddy && pnpm build` | ✅ | Build Web-Buddy packages |

## 🔧 Troubleshooting

### ❌ Common Mistakes
**Using npm instead of pnpm:**
```bash
npm install     # ❌ Wrong - will cause workspace issues
pnpm install    # ✅ Correct - uses pnpm workspace
```

### 🚨 Build Issues
If you encounter problems:

1. **Clean and reinstall:**
   ```bash
   rm -rf node_modules && pnpm install
   ```

2. **Check TypeScript errors:**
   ```bash
   pnpm run typecheck
   ```

3. **Build step by step:**
   ```bash
   pnpm run build
   ```

### 🏥 Development Server Issues
- The dev server (`pnpm run dev`) runs a **minimal HTTP server** for testing
- For full AI features, you need API keys in `.env`
- For complete functionality, build all workspace packages first

## 🎯 Next Steps

1. **Explore the API** - Try the endpoints at `http://localhost:3000`
2. **Install the Extension** - Load it in Chrome for browser automation
3. **Read the Documentation** - Check `README.md` for detailed guides
4. **Add AI Features** - Set up API keys for OpenAI/Anthropic integration

## 🆘 Need Help?

- 📚 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/rydnr/chatgpt-buddy/issues)
- 💬 [Discussions](https://github.com/rydnr/chatgpt-buddy/discussions)

---

🎉 **You're ready to start developing with ChatGPT-Buddy!**