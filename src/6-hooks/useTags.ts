import { useContext, useEffect, useState } from 'react';

import { AppStorageContext } from '../5-app/contexts';
import { Tag } from '../entities/Tag';

export function useTags() {
  const store = useContext(AppStorageContext);
  const [list, setList] = useState<Tag[]>([]);

  useEffect(() => {
    store.fetchTags().then(setList);
    return store.onTagsChange(setList);
  });

  return list;
}
