import { useState } from 'react';

import { getSetting, setSetting, Settings } from '../services/settings';

export function useSetting<
  Key extends keyof Settings,
  Value extends Settings[Key]
>(key: Key) {
  const value = getSetting(key);
  const [_, setValue] = useState(value);

  return [
    value,
    newValue => {
      setSetting(key, newValue);
      setValue(newValue);
    },
  ] as [Value, (newValue: Value) => void];
}
