# AI App Backend API Server

A production-ready backend API server that handles all AI services for the frontend application.

## 🚀 Features

- **Search API** - Real-time web search via RapidAPI
- **Calendar Parsing** - Natural language to calendar events via OpenAI
- **Image Generation** - AI image generation via Replicate
- **Text-to-Speech** - Voice synthesis via Azure TTS
- **Health Monitoring** - Service status and health checks
- **Security** - Helmet.js security headers, CORS protection
- **Performance** - Gzip compression, request logging

## 📋 Requirements

- Node.js 18+ 
- npm or yarn
- API keys for services (see Environment Variables)

## 🛠️ Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Start production server:**
   ```bash
   npm start
   ```

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `FRONTEND_URL` | Frontend URL for CORS | No |
| `OPENAI_API_KEY` | OpenAI API key for calendar parsing | Yes |
| `RAPIDAPI_KEY` | RapidAPI key for search | Yes |
| `REPLICATE_API_KEY` | Replicate API key for image generation | Yes |
| `AZURE_TTS_KEY` | Azure TTS key for voice synthesis | No |

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Service status and configuration

### Search
- `GET /api/search?q=query` - Real-time web search

### Calendar Parsing
- `POST /api/parse-calendar-text` - Parse natural language to calendar events

### Image Generation
- `POST /api/replicate/predictions` - Start image generation
- `GET /api/replicate/predictions/:id` - Check generation status

### Text-to-Speech
- `POST /api/azure-tts` - Convert text to speech

## 🚀 Deployment

### Heroku
```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set OPENAI_API_KEY=your-key
heroku config:set RAPIDAPI_KEY=your-key
heroku config:set REPLICATE_API_KEY=your-key

# Deploy
git push heroku main
```

### Railway
```bash
# Connect to Railway
railway login
railway init

# Deploy
railway up
```

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker
```bash
# Build image
docker build -t ai-app-backend .

# Run container
docker run -p 3000:3000 --env-file .env ai-app-backend
```

## 🔧 Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (not implemented yet)

### Logging
The server uses Morgan for HTTP request logging and console logging for API operations.

### Error Handling
- Comprehensive error handling for all API endpoints
- Graceful fallbacks for missing API keys
- Detailed error messages in development mode

## 🛡️ Security

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing protection
- **Input validation** - Request parameter validation
- **Rate limiting** - Can be added for production
- **API key protection** - Keys stored in environment variables

## 📊 Monitoring

- Health check endpoint for service monitoring
- Request logging with Morgan
- Service status reporting
- Error tracking and logging

## 🔄 Updates

To update the backend:

1. Pull latest changes
2. Install new dependencies: `npm install`
3. Restart the server: `npm start`

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**
   - Change PORT in .env file
   - Kill existing process: `lsof -ti:3000 | xargs kill`

2. **API key errors**
   - Verify all required API keys are set in .env
   - Check API key validity and quotas

3. **CORS errors**
   - Update FRONTEND_URL in .env
   - Check frontend URL configuration

4. **Memory issues**
   - Increase Node.js memory limit: `node --max-old-space-size=4096 server.js`

### Logs
Check server logs for detailed error information:
```bash
# Heroku
heroku logs --tail

# Railway
railway logs

# Local
npm run dev
``` 