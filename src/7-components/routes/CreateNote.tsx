import React, { useEffect } from 'react';

import { useCreateNote } from '../../6-hooks/useCreateNote';
import { Loader } from '../atoms/Loader';

export function CreateNote() {
  const createNote = useCreateNote();
  useEffect(createNote, []);
  return <Loader />;
}
