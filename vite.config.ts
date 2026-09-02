import {fileURLToPath} from 'node:url';
import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

const envDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({mode}) => ({
  root:    'src',
  envDir,
  plugins: [react(), mkcert()],
  server:  {host: true, allowedHosts: true, port: Number(loadEnv(mode, envDir, 'PORT').PORT)},
  build:   {outDir: '../dist/client', emptyOutDir: true}
}));
