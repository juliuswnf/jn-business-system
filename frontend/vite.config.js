import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  // Support CommonJS modules
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@context': path.resolve(__dirname, './src/context'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
    // Support both ESM and CommonJS
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },

  server: {
    port: 5173,
    host: 'localhost',
    strictPort: false,
    open: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true, // ✅ Enable source maps for production debugging
    minify: 'terser',
    target: 'ES2020',
    cssCodeSplit: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Keep React in main bundle to avoid race conditions
          // React must load before any component that uses it

          // Router (can be separate)
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }
          // Charts library (large, separate chunk)
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'charts';
          }
          // UI libraries
          if (id.includes('node_modules/@heroicons') ||
              id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/react-icons')) {
            return 'icons';
          }
          // Utils
          if (id.includes('node_modules/axios') ||
              id.includes('node_modules/date-fns') ||
              id.includes('node_modules/clsx')) {
            return 'utils';
          }
          // Stripe
          if (id.includes('node_modules/@stripe')) {
            return 'stripe';
          }
          // i18n
          if (id.includes('node_modules/i18next')) {
            return 'i18n';
          }
          // Everything else (including React) goes to main bundle
        },
      },
    },
    // Terser options for better minification
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },

  css: {
    postcss: './postcss.config.js',
  },

  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    'process.env': {},
    global: 'globalThis',
  },
});
