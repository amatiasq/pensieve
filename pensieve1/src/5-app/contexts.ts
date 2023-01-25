import { createContext } from 'react';
import { AppStorage } from '../4-storage/AppStorage';

export const StorageContext = createContext<AppStorage>(null!);
