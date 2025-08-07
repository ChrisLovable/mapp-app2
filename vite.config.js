import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { format, toZonedTime } from 'date-fns-tz';
// https://vitejs.dev/config/
// Helper to get build time in SAST (GMT+2) at build time
function getSASTBuildTimestamp() {
    const now = new Date();
    const timeZone = 'Africa/Johannesburg';
    const zoned = toZonedTime(now, timeZone);
    return format(zoned, 'yyyy-MM-dd HH:mm:ssXXX', { timeZone });
}
export default defineConfig(({ mode }) => ({
    plugins: [react()],
    define: {
        '__BUILD_TIMESTAMP__': JSON.stringify(getSASTBuildTimestamp()),
    },
    server: {
        host: '0.0.0.0',
        proxy: mode === 'development' ? {
            '/api': {
                target: 'http://192.168.101.105:3000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        } : undefined
    }
}));
