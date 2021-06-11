import { useContext, useEffect, useState } from 'react';

import { AppStorage } from '../../4-storage/AppStorage';
import { AppStorageContext } from '../../5-app/contexts';

export function hookStore<Item, Args extends unknown[]>(
  defaultValue: Item,
  definition: (...args: Args) => (store: AppStorage, setValue: (item: Item) => void) => () => boolean | void,
) {
  return (...args: Args) => {
    const store = useContext(AppStorageContext);
    const [value, setValue] = useState<Item>(defaultValue);

    useEffect(() => definition(...args)(store, setValue) as () => void, args);

    return value;
  };
}
