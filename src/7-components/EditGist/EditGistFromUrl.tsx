import React from 'react';
import { useParams } from 'react-router-dom';

import { NoteId } from '../../2-entities/Note';
import { useMemory } from '../../6-hooks/useMemory';
import { useNote } from '../../6-hooks/useNote';
import { GistEditor } from './GistEditor';

export function EditGistFromUrl() {
  const { gistId, filename } = useParams() as { [key: string]: string };
  const [username] = useMemory('username');
  const gist = useNote(gistId as NoteId);
  const file = gist?.getFileByName(filename) || gist?.defaultFile;

  if (!gist || !file || !file.hasContent) {
    return <p>Loading...</p>;
  }

  return <GistEditor gist={gist} file={file} readonly={!gist.isOwner(username)} />;
}
