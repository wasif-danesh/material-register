import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [reactRouter()],
  // A fixed port, because the API only accepts browser calls from this address.
  server: { port: 5173, strictPort: true },
  // Development only. With React Router's framework mode, Vite does not find these
  // packages until the browser first asks for a page; it then rebuilds its dependency
  // cache and reloads the browser once. Listing them prepares them at start-up, so the
  // first page load after a fresh clone is a normal one.
  optimizeDeps: {
    include: [
      '@mantine/core',
      '@mantine/form',
      '@tabler/icons-react',
      '@tanstack/react-query',
      '@trpc/client',
      '@trpc/tanstack-react-query',
      'zod',
    ],
  },
});
