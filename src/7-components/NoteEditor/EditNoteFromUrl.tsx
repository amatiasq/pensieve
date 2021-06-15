import React from 'react';
import { useParams } from 'react-router-dom';

import { NoteId } from '../../2-entities/Note';
import { useNote } from '../../6-hooks/useNote';
import { useNoteContent } from '../../6-hooks/useNoteContent';
import { Loader } from '../atoms/Loader';
import { NoteEditor } from './NoteEditor';

export function EditNoteFromUrl() {
  const { noteId } = useParams() as { noteId: NoteId };
  const [note, isNoteLoading] = useNote(noteId);
  const [content, isContentLoading] = useNoteContent(noteId);

  if (isNoteLoading || isContentLoading) {
    return <Loader />;
  }

  return <NoteEditor note={note!} content={content} />;
}
