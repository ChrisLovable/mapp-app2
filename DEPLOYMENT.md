# Deployment Guide

## 🚀 Deploy to Vercel

### Prerequisites
- Node.js 18+ installed
- Vercel CLI installed (`npm i -g vercel`)
- Supabase project set up (optional, for full functionality)

### Environment Variables
Create a `.env` file in the root directory with:

```env
# Supabase (optional - app works without it)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Other API keys (optional)
VITE_OPENAI_API_KEY=your_openai_key
VITE_SERPAPI_KEY=your_serpapi_key
```

### Deploy Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel
   ```

4. **Or deploy directly:**
   ```bash
   vercel --prod
   ```

### Manual Deployment

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings

### Features Included

✅ **Video Title**: Hologram MP4 with autoplay  
✅ **Authentication**: Sign-in/Sign-up system  
✅ **Glass Morphism**: Beautiful UI effects  
✅ **Service Worker**: Video caching for performance  
✅ **Responsive Design**: Works on all devices  
✅ **PWA Ready**: Can be installed as app  

### Post-Deployment

1. **Set Environment Variables** in Vercel dashboard
2. **Test Authentication** flow
3. **Verify Video Playback** works
4. **Check Mobile Responsiveness**

### Troubleshooting

- **Video not playing**: Check browser autoplay policies
- **Build errors**: Ensure all dependencies are installed
- **Authentication issues**: Verify Supabase environment variables

### Performance Optimizations

- Video is cached by service worker
- Optimized build with Vite
- Lazy loading for better performance