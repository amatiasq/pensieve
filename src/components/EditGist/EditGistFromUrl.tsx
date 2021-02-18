import React from 'react';
import { useParams } from 'react-router-dom';

import { GistId } from '../../contracts/type-aliases';
import { useGist } from '../../hooks/useGist';
import { useSetting } from '../../hooks/useSetting';
import { GistEditor } from './GistEditor';

export function EditGistFromUrl() {
  const { gistId, filename } = useParams() as { [key: string]: string };
  const [username] = useSetting('username');
  const gist = useGist(gistId as GistId);
  const file = gist?.getFileByName(filename) || gist?.defaultFile;

  if (!gist || !file || !file.content) {
    return <p>Loading...</p>;
  }

  return (
    <GistEditor gist={gist} file={file} readonly={!gist.isOwner(username)} />
  );
}
