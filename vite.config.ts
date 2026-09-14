import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // 输出到 docs/ 以便 GitHub Pages 直接部署（Pages API 仅支持 / 与 /docs）
    outDir: 'docs',
    emptyOutDir: true,
  },
});
