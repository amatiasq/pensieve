import './EditGist.scss';

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Editor from '@monaco-editor/react';

import { getFiles } from '../contracts/Gist-methods';
import { GistDetails } from '../contracts/GistDetails';
import { GistFileDetails } from '../contracts/GistFileDetails';
import { GistId } from '../contracts/type-aliases';
import { getGist } from '../services/api';

export function EditGist() {
  const { gistId, filename } = useParams() as { [key: string]: string };

  const [details, setDetails] = useState<GistDetails>();
  const file = details ? details.files[filename] : null;

  useEffect(() => {
    getGist(gistId as GistId).then(setDetails);
  }, [gistId]);

  if (!details || !file) {
    return <p>Loading...</p>;
  }

  return <GistEditor gist={details} defaultFile={file} />;
}

function GistEditor({
  gist,
  defaultFile,
}: {
  gist: GistDetails;
  defaultFile: GistFileDetails;
}) {
  const [file, setFile] = useState<GistFileDetails>(defaultFile);
  const [value, setValue] = useState<string>();

  useEffect(() => {
    if (file) {
      document.title = defaultFile.filename;
    }

    setValue(file.content);
  }, [file]);

  if (!value) return <p>Loading...</p>;

  const lines = value.split('\n').length;

  return (
    <div className="editor">
      <nav className="tabs">
        <Link to="/">
          <button>◀️</button>
        </Link>
        {getFiles(gist).map(x => (
          <button
            key={x.filename}
            className={x === file ? 'active' : ''}
            onClick={() => setFile(x)}
          >
            {x.filename}
          </button>
        ))}
        <div className="spacer"></div>
      </nav>

      <Editor
        height="100vh"
        theme="vs-dark"
        defaultLanguage={file.language.toLowerCase()}
        value={value}
        options={{
          minimap: { enabled: lines > 100 },
          contextmenu: false,
        }}
        onChange={setValue}
      />
    </div>
  );
}
