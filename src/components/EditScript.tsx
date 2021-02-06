import React, { useEffect, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';

import Editor from '@monaco-editor/react';

import { GistDetails } from '../contracts/GistDetails';
import { GistId } from '../contracts/type-aliases';
import { getGist } from '../services/api';

export function EditScript() {
  const path = useRouteMatch();
  const { gistId, filename } = path.params as { [key: string]: string };
  const [details, setDetails] = useState<GistDetails>();
  const file = details ? details.files[filename] : null;

  useEffect(() => {
    getGist(gistId as GistId).then(setDetails);

    if (file) {
      document.title = file.filename;
    }
  }, [gistId, file]);

  if (!file) {
    return <p>Loading...</p>;
  }

  return (
    <Editor
      height="100vh"
      theme="vs-dark"
      defaultLanguage={file.language.toLowerCase()}
      defaultValue={file.content}
      onChange={x => console.log(x)}
    />
  );
}
