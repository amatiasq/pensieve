import { createContext } from 'react';
import { NotesStorage } from '../4-storage/NotesStorage.ts';

export const StorageContext = createContext<NotesStorage>(null!);
