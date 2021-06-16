import React, { useContext } from 'react';
import { useParams } from 'react-router-dom';

import { getMetadataFromContent, NoteId } from '../../2-entities/Note';
import { AppStorageContext } from '../../5-app/contexts';
import { useNote } from '../../6-hooks/useNote';
import { useNoteContent } from '../../6-hooks/useNoteContent';
import { Loader } from '../atoms/Loader';
import { Editor } from '../Editor/Editor';

export function EditNoteFromUrl() {
  const { noteId } = useParams() as { noteId: NoteId };
  const store = useContext(AppStorageContext);
  const [note, isNoteLoading] = useNote(noteId);
  const [content, isContentLoading] = useNoteContent(noteId);

  if (isNoteLoading || isContentLoading || !note) {
    return <Loader />;
  }

  return (
    <Editor
      key={note.id}
      title={note.title}
      content={content}
      saveOnNavigation
      onChange={update}
      onSave={(value, options) => store.setNoteContent(note.id, value, options)}
    />
  );

  function update(value: string): void {
    const { title } = getMetadataFromContent(value);
    console.log(title);
    store.noteChanged(note!.id, { ...note!, title });
  }
}
