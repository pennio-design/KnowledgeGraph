import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/KnowledgeGraph/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          reactflow: ['reactflow'],
          pdf: ['jspdf', 'html2canvas'],
        },
      },
    },
  },
});
