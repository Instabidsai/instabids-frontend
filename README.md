# InstaBids Frontend

Production-ready frontend for InstaBids with real-time agent visualization, CopilotKit AI assistant, and robust error handling.

## 🚀 Features

- **Real-time Agent Visualization**: Live status updates for all 5 agents
- **WebSocket Integration**: Real-time bidirectional communication
- **CopilotKit AI Assistant**: Integrated AI help for form filling and project tracking
- **Robust Error Handling**: User-friendly error messages and form validation
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI/UX**: Smooth animations with Framer Motion

## 📋 Prerequisites

- Node.js 18+ and npm
- Git
- An OpenAI API key (for CopilotKit)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/Instabidsai/instabids-frontend.git
cd instabids-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example env file
cp .env.local.example .env.local

# Edit .env.local and add your OpenAI API key
```

## 🏃‍♂️ Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment

### Automatic Deployment (Recommended)

Run the deployment script:

```bash
# On Windows, use Git Bash or WSL
./deploy.sh
```

### Manual Deployment to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_WEBSOCKET_URL`
   - `OPENAI_API_KEY`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_WEBSOCKET_URL` | WebSocket URL | Yes |
| `OPENAI_API_KEY` | OpenAI API key for CopilotKit | Yes |

## 📁 Project Structure

```
instabids-frontend/
├── app/
│   ├── api/
│   │   ├── copilotkit/      # CopilotKit API endpoint
│   │   └── test/            # Health check endpoint
│   ├── layout.tsx           # Root layout with CopilotKit
│   ├── page.tsx             # Main application page
│   └── globals.css          # Global styles
├── lib/
│   └── utils.ts             # Utility functions
├── package.json
├── tailwind.config.js
└── deploy.sh                # Deployment script
```

## 🧪 Testing

### API Health Check
```bash
# Local
curl http://localhost:3000/api/test

# Production
curl https://your-app.vercel.app/api/test
```

### Form Validation Testing
1. Try submitting with empty fields
2. Test with invalid budget (negative numbers)
3. Submit valid data and check console for WebSocket connection

## 🐛 Troubleshooting

### CORS Issues
If you see CORS errors, ensure your backend includes the frontend URL in allowed origins.

### WebSocket Connection Failed
Check that your backend WebSocket endpoint is properly configured and accessible.

### Environment Variables Not Working
- Ensure variables are set in Vercel dashboard
- Rebuild deployment after adding variables
- Use `vercel env pull` to sync local variables

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Backend Repository](https://github.com/Instabidsai/instabids-agent-swarm)
- [Live Demo](https://instabids-frontend.vercel.app)
- [API Documentation](https://instabids-agent-swarm-8k5am.ondigitalocean.app/docs)