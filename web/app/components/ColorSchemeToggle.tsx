import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';

/**
 * Switches between light and dark. Until the user picks one, the app follows the
 * operating system setting; Mantine remembers the choice in local storage.
 */
export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  // "auto" resolved to what is actually showing right now.
  const current = useComputedColorScheme('light');
  const next = current === 'dark' ? 'light' : 'dark';

  return (
    <ActionIcon
      variant="default"
      size="lg"
      aria-label={`Switch to ${next} theme`}
      onClick={() => setColorScheme(next)}
    >
      {current === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  );
}
