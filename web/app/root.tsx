// Mantine's styles must be imported before any other styles.
import '@mantine/core/styles.css';

import {
  Alert,
  AppShell,
  Center,
  ColorSchemeScript,
  Container,
  Group,
  Loader,
  MantineProvider,
  mantineHtmlProps,
  Title,
} from '@mantine/core';
import { IconPackages } from '@tabler/icons-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpLink } from '@trpc/client';
import type { AppRouter } from '@material-register/api';
import { useState, type ReactNode } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { ColorSchemeToggle } from './components/ColorSchemeToggle.tsx';
import { theme } from './theme.ts';
import { API_URL, TRPCProvider } from './trpc.ts';

/** The HTML document. React Router renders every route, and the fallbacks, inside it. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Sets the colour scheme before the first paint, so there is no flash of
            the light theme for someone who uses dark. */}
        <ColorSchemeScript defaultColorScheme="auto" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          {children}
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // Created once per browser session. useState keeps the same instances across renders.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // One retry covers a brief network blip without hiding a real outage for long.
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({ links: [httpLink({ url: API_URL })] }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <AppShell header={{ height: 56 }} padding="md">
          <AppShell.Header>
            <Container size="xl" h="100%">
              <Group h="100%" justify="space-between">
                <Group gap="xs">
                  <IconPackages size={22} aria-hidden />
                  <Title order={1} size="h4">
                    Material register
                  </Title>
                </Group>
                <ColorSchemeToggle />
              </Group>
            </Container>
          </AppShell.Header>
          <AppShell.Main>
            <Container size="xl">
              <Outlet />
            </Container>
          </AppShell.Main>
        </AppShell>
      </TRPCProvider>
    </QueryClientProvider>
  );
}

/** Shown while the JavaScript loads. It is the only part rendered into index.html. */
export function HydrateFallback() {
  return (
    <Center h="100vh">
      <Loader aria-label="Loading" />
    </Center>
  );
}

/** Catches errors thrown while rendering, so a bug shows a message, not a blank page. */
export function ErrorBoundary() {
  return (
    <Container size="sm" py="xl">
      <Alert color="red" title="Something went wrong">
        Reload the page to try again.
      </Alert>
    </Container>
  );
}
