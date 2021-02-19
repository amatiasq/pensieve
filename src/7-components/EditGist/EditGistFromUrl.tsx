import React from 'react';
import { useParams } from 'react-router-dom';

import { GistId } from '../../2-github/type-aliases';
import { useGist } from '../../6-hooks/useGist';
import { useMemory } from '../../6-hooks/useMemory';
import { GistEditor } from './GistEditor';

export function EditGistFromUrl() {
  const { gistId, filename } = useParams() as { [key: string]: string };
  const [username] = useMemory('username');
  const gist = useGist(gistId as GistId);
  const file = gist?.getFileByName(filename) || gist?.defaultFile;

  if (!gist || !file || !file.hasContent) {
    return <p>Loading...</p>;
  }

  return (
    <GistEditor gist={gist} file={file} readonly={!gist.isOwner(username)} />
  );
}
