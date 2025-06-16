#!/bin/bash

# InstaBids Frontend Deployment Script
# This script automates the deployment process to Vercel

echo "🚀 InstaBids Frontend Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

if ! command_exists git; then
    echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites are installed${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found. Make sure you're in the instabids-frontend directory${NC}"
    exit 1
fi

# Create necessary config files
echo -e "${YELLOW}Creating configuration files...${NC}"

# Create .gitignore
cat > .gitignore << EOL
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
EOL

# Create tsconfig.json
cat > tsconfig.json << EOL
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOL

# Create next.config.js
cat > next.config.js << EOL
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
EOL

# Create postcss.config.js
cat > postcss.config.js << EOL
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOL

# Create .env.local.example
cat > .env.local.example << EOL
# Backend API Configuration
NEXT_PUBLIC_API_URL=https://instabids-agent-swarm-8k5am.ondigitalocean.app
NEXT_PUBLIC_WEBSOCKET_URL=wss://instabids-agent-swarm-8k5am.ondigitalocean.app/ws/project

# OpenAI API Key for CopilotKit
OPENAI_API_KEY=your_openai_api_key_here
EOL

echo -e "${GREEN}✅ Configuration files created${NC}"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Build the project
echo -e "${YELLOW}Building the project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Please check for errors above.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project built successfully${NC}"

# Check if Vercel CLI is installed
if ! command_exists vercel; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

# Deploy to Vercel
echo -e "${YELLOW}Deploying to Vercel...${NC}"
echo -e "${YELLOW}You will be prompted to login to Vercel if not already logged in${NC}"

vercel --prod

echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Copy .env.local.example to .env.local and add your OpenAI API key"
echo "2. Set environment variables in Vercel dashboard"
echo "3. Test the deployment using the provided URL"
echo ""
echo "For local development, run: npm run dev"