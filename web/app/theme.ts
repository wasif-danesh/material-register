import { createTheme, type MantineColor } from '@mantine/core';
import type { MaterialStatus } from '@material-register/shared';

// The one place that sets the look of the app. Components use these tokens through
// Mantine props (c="dimmed", fz="sm", gap="md") and never hard-code colours or sizes,
// which is also what makes the dark theme work without extra code.
export const theme = createTheme({
  primaryColor: 'indigo',
  defaultRadius: 'md',
  // Mantine's default font is the operating system's own interface font: nothing to
  // download, and no request to an outside font server.
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  headings: { fontWeight: '600' },
});

/** One colour per status, used wherever a status is shown. The badge always has text too. */
export const STATUS_COLORS: Record<MaterialStatus, MantineColor> = {
  Active: 'green',
  'Pending Review': 'yellow',
  Obsolete: 'gray',
};
