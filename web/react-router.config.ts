import type { Config } from '@react-router/dev/config';

export default {
  // SPA mode: no server rendering. The build produces static files, and all routing
  // and data loading happen in the browser.
  ssr: false,
  // React Router 7 prints a start-up warning for every v8 behaviour that has not been
  // decided on. The brief requires v7, so each one is explicitly left off: the app
  // keeps v7 behaviour and the terminal stays readable. Turning these on one at a time
  // is the upgrade path to v8.
  future: {
    v8_middleware: false,
    v8_splitRouteModules: false,
    v8_viteEnvironmentApi: false,
    v8_passThroughRequests: false,
    v8_trailingSlashAwareDataRequests: false,
  },
} satisfies Config;
