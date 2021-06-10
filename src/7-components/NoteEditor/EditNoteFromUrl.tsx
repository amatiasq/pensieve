import React from 'react';
import { useParams } from 'react-router-dom';

import { useNote } from '../../6-hooks/useNote';
import { useNoteContent } from '../../6-hooks/useNoteContent';
import { NoteId } from '../../entities/Note';
import { NoteEditor } from './NoteEditor';

export function EditNoteFromUrl() {
  const { noteId } = useParams() as { noteId: NoteId };
  const note = useNote(noteId);
  const content = useNoteContent(noteId);

  if (!note) {
    return <p>Loading...</p>;
  }

  return <NoteEditor note={note} content={content} />;
}
