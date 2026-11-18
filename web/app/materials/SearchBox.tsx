import { Button, CloseButton, Group, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';

type SearchBoxProps = {
  /** The search currently applied, taken from the URL. */
  value: string;
  onSearch: (text: string) => void;
};

/**
 * The search runs on the button or the Enter key, never while typing, so one search
 * is one request. What is being typed is local state; the URL only changes on submit.
 *
 * The parent renders this with `key={value}`, so when the applied search changes from
 * outside (the back button, or "Clear search and filters") the box starts again with
 * the new text.
 */
export function SearchBox({ value, onSearch }: SearchBoxProps) {
  const [text, setText] = useState(value);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(text.trim());
      }}
    >
      <Group align="end" gap="sm" wrap="nowrap">
        <TextInput
          label="Search"
          placeholder="Material number, description or part number"
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
          maxLength={100}
          flex={1}
          rightSection={
            text ? (
              <CloseButton
                aria-label="Clear search"
                onClick={() => {
                  setText('');
                  // Only re-query if a search was actually applied.
                  if (value) onSearch('');
                }}
              />
            ) : null
          }
        />
        <Button type="submit" leftSection={<IconSearch size={16} aria-hidden />}>
          Search
        </Button>
      </Group>
    </form>
  );
}
