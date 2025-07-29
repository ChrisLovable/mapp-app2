@echo off
echo Starting AI Diary Application...
echo.
echo This will start both the frontend and Azure TTS proxy servers.
echo.
echo Frontend: http://localhost:5173
echo Azure TTS Proxy: http://localhost:4000
echo.
echo Press Ctrl+C to stop both servers.
echo.

npm run dev:full 