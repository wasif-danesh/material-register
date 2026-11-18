import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [reactRouter()],
  // A fixed port, because the API only accepts browser calls from this address.
  server: { port: 5173, strictPort: true },
});
