import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE (PDD §11): FrameSync deliberately uses the SINGLE-THREADED @ffmpeg/core,
// which does NOT need SharedArrayBuffer. We therefore do NOT set
// Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy — enabling COEP
// (`require-corp`) would break cross-origin S3 media and Google Fonts.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // REST API
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      // Socket.io (WebSocket upgrade) — keeps everything same-origin in dev.
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  // ffmpeg-core wasm is large; don't inline it as base64.
  build: {
    assetsInlineLimit: 0,
  },
});
