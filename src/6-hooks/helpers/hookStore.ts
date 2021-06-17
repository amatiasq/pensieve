import { useContext, useEffect, useState } from 'react';

import { AppStorage } from '../../4-storage/AppStorage';
import { AppStorageContext } from '../../5-app/contexts';

export function hookStore<Item, Args extends unknown[]>(
  defaultValue: Item,
  definition: (
    ...args: Args
  ) => (
    store: AppStorage,
    setValue: (item: Item) => void,
  ) => () => boolean | void,
) {
  return (...args: Args) => {
    const store = useContext(AppStorageContext);
    const [loading, setLoading] = useState(true);
    const [value, setValue] = useState<Item>(defaultValue);

    useEffect(() => {
      setLoading(true);
      return definition(...args)(store, initialize) as () => void;
    }, args);

    return [value, loading] as const;

    function initialize(x: Item) {
      setValue(x);
      setLoading(false);
    }
  };
}
