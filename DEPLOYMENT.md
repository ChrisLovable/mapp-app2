# Deployment Guide

## Environment Variables Setup

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

#### Required Variables:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Optional Variables (if using OpenAI features):
```
VITE_OPENAI_API_KEY=your_openai_api_key
```

### For Other Platforms

Add these environment variables to your deployment platform:

- **Netlify**: Add in Site Settings → Environment Variables
- **Railway**: Add in Variables tab
- **Heroku**: Add via `heroku config:set` or dashboard

### Local Development

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

## Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project or select existing project
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key

## Troubleshooting

### White Screen Issue
If you see a white screen, it's likely due to missing environment variables. The app will now show a helpful error message instead of crashing.

### Build Errors
Make sure all environment variables are properly set before deploying.

## Features That Require Supabase
- User authentication
- Data persistence
- Real-time features
- Database operations

## Features That Work Without Supabase
- Basic UI components
- Static content
- Client-side features