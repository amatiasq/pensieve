import { useContext } from 'react';
import { StorageContext } from '../5-app/contexts.ts';

export function useStore() {
  return useContext(StorageContext);
}
