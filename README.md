# myAIpartner.co.za

A comprehensive AI-powered personal assistant application with multiple features including image generation, text processing, calendar management, expense tracking, and more.

## 🚀 Features

- **AI Image Generation**: Create images using Replicate's Stable Diffusion models
- **Text Processing**: Translation, rewriting, grammar correction
- **Calendar Management**: Natural language calendar event creation
- **Expense Tracking**: AI-powered expense parsing and management
- **Todo Lists**: Smart task parsing and management
- **Shopping Lists**: Intelligent shopping list creation
- **PDF Processing**: Extract and analyze PDF content
- **Speech Recognition**: Voice-to-text functionality
- **Text-to-Speech**: Multi-language voice synthesis
- **Meeting Recording**: Smart meeting minutes generation
- **Diary Entries**: AI-assisted journal writing

## 🔧 Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- OpenAI API key
- Replicate API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd myAIpartner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Frontend Environment Variables
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   VITE_REPLICATE_API_KEY=your_replicate_api_key_here
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_RAPIDAPI_KEY=your_rapidapi_key_here
   VITE_SERPAPI_KEY=your_serpapi_key_here
   VITE_OPENROUTERAI_API_KEY=your_openrouter_api_key_here
   ```

   Create a `.env` file in the `backend/` directory:
   ```env
   # Backend Environment Variables
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   OPENAI_API_KEY=your_openai_api_key_here
   RAPIDAPI_KEY=your_rapidapi_key_here
   REPLICATE_API_KEY=your_replicate_api_key_here
   AZURE_TTS_KEY=your_azure_tts_key_here
   DATABASE_URL=your_database_url_here
   JWT_SECRET=your_jwt_secret_here
   ```

4. **Set up Supabase Database**
   
   Run the SQL scripts in your Supabase SQL Editor:
   - `secure_rls_policies.sql` - Sets up secure Row Level Security policies
   - `calendar_events_table.sql` - Creates calendar events table
   - `expense_tracker_table.sql` - Creates expense tracking table
   - `todos_table.sql` - Creates todos table
   - `shopping_items_table.sql` - Creates shopping items table
   - `info_vault_table.sql` - Creates info vault table
   - `user_comments_table.sql` - Creates user comments table
   - `diary_entries_table.sql` - Creates diary entries table
   - `meeting_recordings_table.sql` - Creates meeting recordings table

5. **Configure Supabase Authentication**
   
   In your Supabase dashboard:
   - Go to Authentication → Settings
   - Enable Email provider
   - Configure email templates (optional)
   - Set up email verification (recommended)

6. **Start the development servers**
   
   In the root directory:
   ```bash
   # Start the frontend (Vite dev server)
   npm run dev
   ```
   
   In the `backend/` directory:
   ```bash
   # Start the backend API server
   npm run dev
   ```

## 🔐 Authentication

The application now requires user authentication for all features. Users can:

- **Sign up** with email and password
- **Sign in** with existing credentials
- **Verify email** (required for full access)
- **Reset password** via email

All database operations are secured with Row Level Security (RLS) policies that ensure users can only access their own data.

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Supabase Client** for authentication and database

### Backend
- **Node.js** with Express
- **Consolidated API** service handling all external API calls
- **Environment-based configuration**
- **CORS** enabled for frontend communication

### Database
- **Supabase** (PostgreSQL)
- **Row Level Security** for data isolation
- **Real-time subscriptions** for live updates

## 🚀 Deployment

### Frontend Deployment
The frontend can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

### Backend Deployment
The backend can be deployed to:
- Heroku
- Railway
- DigitalOcean
- AWS/GCP/Azure

See `DEPLOYMENT.md` for detailed deployment instructions.

## 🔧 Development

### Available Scripts

   ```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend
cd backend
npm run dev          # Start backend with nodemon
npm start            # Start backend in production
```

### API Endpoints

The backend provides the following endpoints:
- `POST /api/replicate/predictions` - Image generation
- `GET /api/replicate/predictions/:id` - Check generation status
- `POST /api/parse-calendar-text` - Calendar text parsing
- `POST /api/search` - Real-time search
- `POST /api/tts` - Text-to-speech (mocked)

## 🔒 Security

- **Environment variables** for all API keys
- **Row Level Security** on all database tables
- **User authentication** required for all features
- **CORS** configured for secure cross-origin requests
- **Input validation** on all API endpoints

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support or questions, please open an issue on GitHub.
"# Auto-deployment test" 
