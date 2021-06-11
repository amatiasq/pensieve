import { createContext } from 'react';

import { AppStorage } from '../4-storage/AppStorage';

export const AppStorageContext = createContext<AppStorage>(null!);
