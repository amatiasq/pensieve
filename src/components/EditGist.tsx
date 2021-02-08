import './EditGist.scss';

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Editor from '@monaco-editor/react';

import { getFiles } from '../contracts/Gist-methods';
import { GistDetails } from '../contracts/GistDetails';
import { GistFile } from '../contracts/GistFile';
import { GistFileDetails } from '../contracts/GistFileDetails';
import { useGithubApi } from '../hooks/useGithubApi';
import { useScheduler } from '../hooks/useScheduler';
import { updateGist } from '../services/github_api';

const DELAY = 5;

export function EditGist() {
  const { gistId, filename } = useParams() as { [key: string]: string };
  const gist = useGithubApi<GistDetails>(`/gists/${gistId}`);
  const file = gist ? gist.files[filename] : null;

  if (!gist || !file) {
    return <p>Loading...</p>;
  }

  return <GistEditor gist={gist} defaultFile={file} />;
}

function GistEditor({
  gist,
  defaultFile,
}: {
  gist: GistDetails;
  defaultFile: GistFileDetails;
}) {
  const [isSaved, setIsSaved] = useState(true);
  const [file, setFile] = useState<GistFileDetails>(defaultFile);
  const [value, setValue] = useState<string | null>(null);

  const scheduler = useScheduler(DELAY * 1000, () => {
    if (isSaved) return;
    saveFile(file, value);
    setIsSaved(true);
  });

  useEffect(() => {
    if (file) {
      document.title = defaultFile.filename;
    }

    setValue(file.content);
  }, [file]);

  useEffect(() => {
    window.addEventListener('keydown', event => {
      if (event.metaKey && event.key === 's') {
        event.preventDefault();
        scheduler.run();
      }
    });
  }, []);

  if (value == null) return <p>Loading...</p>;

  const lines = value.split('\n').length;

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
            onSelect={onFileChange}
            onRename={name => renameFile(x, name)}
          />
        ))}
        <div className="spacer" draggable="true"></div>
        <span>{isSaved ? 'Saved' : `Waiting ${DELAY}s...`}</span>
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
        onChange={onChange}
      />
    </div>
  );

  function onFileChange(newFile: GistFileDetails) {
    if (!isSaved && value != null) {
      saveFile(file, value);
      scheduler.stop();
    }

    setFile(newFile);
  }

  function onChange(value?: string) {
    setIsSaved(false);
    setValue(value || '');
    scheduler.restart();
  }

  function renameFile(file: GistFile, filename: string) {
    return updateGist(gist.id, {
      files: { [file.filename]: { filename } },
    }).then(() => (file.filename = filename));
  }

  function saveFile(file: GistFileDetails, value: string | null) {
    const content = value || "Don't leave this empty";

    if (file.content === content) {
      console.log('NOTHING TO SAVE');
      return;
    }

    return updateGist(gist.id, {
      files: { [file.filename]: { content } },
    }).then(() => (file.content = content));
  }
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
