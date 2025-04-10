import { useEffect } from 'react';
import { useCreateNote } from '../../6-hooks/useCreateNote.ts';
import { Loader } from '../atoms/Loader.tsx';

export function CreateNote() {
  const createNote = useCreateNote();

  useEffect(createNote, []);

  return <Loader />;
}
