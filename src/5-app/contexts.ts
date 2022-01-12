import { createContext } from 'react';
import { NotesStorage } from '../4-storage/NotesStorage';

export const NotesStorageContext = createContext<NotesStorage>(null!);
