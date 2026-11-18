import type { Config } from '@react-router/dev/config';

// SPA mode: no server rendering. The build produces static files, and all routing
// and data loading happen in the browser.
export default {
  ssr: false,
} satisfies Config;
