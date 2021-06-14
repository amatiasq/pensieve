import { createContext } from 'react';

import { TypedStorage } from '../4-storage';

export const AppStorageContext = createContext<TypedStorage>(null!);
