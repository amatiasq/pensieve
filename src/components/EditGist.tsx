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

  console.log({ files: getFiles(gist) });

  return (
    <div className="editor">
      <nav className="tabs">
        <Link to="/">
          <button className="back-button">◀️</button>
        </Link>
        {getFiles(gist).map(x => (
          <FileTab
            key={x.filename}
            file={x}
            isActive={x === file}
            onSelect={setFile}
            onRename={name => console.log(name)}
          />
        ))}
        <div className="spacer" draggable="true"></div>
      </nav>

      <Editor
        height="100vh"
        theme="vs-dark"
        defaultLanguage={file.language.toLowerCase()}
        value={value}
        options={{
          minimap: { enabled: lines > 100 },
          contextmenu: false,
          wordWrap: 'on',
          renderLineHighlight: 'none',
        }}
        onChange={setValue}
      />
    </div>
  );
}

function FileTab({
  file,
  isActive,
  onSelect,
  onRename,
}: {
  file: GistFileDetails;
  isActive: boolean;
  onSelect(file: GistFileDetails): void;
  onRename(name: string): void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(file.filename);

  return (
    <button
      className={isActive ? 'active' : ''}
      onClick={() => onSelect(file)}
      onDoubleClick={() => setIsRenaming(true)}
    >
      <input
        type="text"
        className="rename-field"
        style={{ width: file.filename.length + 'ch' }}
        value={name}
        readOnly={!isRenaming}
        autoFocus
        onChange={x => setName(x.target.value)}
        onKeyDown={onKeyDown}
        onBlur={rename}
      />
    </button>
  );

  function rename() {
    if (name !== file.filename) {
      // TODO: this should go to the server
      file.filename = name;
      onRename(name);
    }

    setIsRenaming(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      rename();
    }

    if (event.key === 'Escape') {
      setName(file.filename);
      setIsRenaming(false);
    }
  }
}
