import { createContext } from 'react';

import { AppStorage } from '../storage/AppStorage';

export const AppStorageContext = createContext<AppStorage>(null!);
