import { useContext } from 'react';
import { StorageContext } from '../5-app/contexts.ts';

export function useUsername() {
  const store = useContext(StorageContext);
  return store.username;
}
