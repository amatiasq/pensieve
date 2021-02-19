import { emitter } from '@amatiasq/emitter';

import { isMobile } from './isMobile';

const CONTROL_KEYS = {
  Meta: 'META',
  Shift: 'SHIFT',
  Alt: 'ALT',
  Control: 'CTRL',
} as const;

const KEY_ALIASES = {
  ' ': 'Space',
} as const;

interface ShortcutEvent {
  key: string;
  keys: string[];
  preventDefault(): void;
}

const emit = emitter<ShortcutEvent>();

export const onShortcut = emit.subscribe;

if (!isMobile) {
  document.addEventListener('keydown', onKeyDown, true);
}

function onKeyDown(event: KeyboardEvent) {
  const keys = [];

  if (event.metaKey) keys.push('META');
  if (event.ctrlKey) keys.push('CTRL');
  if (event.altKey) keys.push('ALT');
  if (event.shiftKey) keys.push('SHIFT');

  if (event.key in CONTROL_KEYS) {
    return;
  }

  const key = getKey(event.key);

  emit({
    key: event.key,
    keys: [...keys.sort(), key],
    preventDefault: () => event.preventDefault(),
  });
}

function getKey(key: string) {
  return key in KEY_ALIASES
    ? KEY_ALIASES[key as keyof typeof KEY_ALIASES]
    : key;
}
