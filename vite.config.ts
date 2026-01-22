
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/KnowledgeGraph/', // Add this line!
  plugins: [react()],
  define: {
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY)
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
