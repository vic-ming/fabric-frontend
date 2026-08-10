import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    // public/assets/ 放的是客戶交付的素材，這裡把打包產物挪到 dist/build 以免混在一起
    assetsDir: 'build',
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
});
