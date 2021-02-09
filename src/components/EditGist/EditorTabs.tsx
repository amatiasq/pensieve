import './EditorTabs.scss';

import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { Gist } from '../../model/Gist';
import { GistFile } from '../../model/GistFile';
import { Action } from '../Action';
import { FileTab } from './FileTab';

export function EditorTabs({
  gist,
  active,
  onChange,
}: {
  gist: Gist;
  active: GistFile;
  onChange: (file: GistFile) => void;
}) {
  const history = useHistory();
  const [newFileName, setNewFileName] = useState<string | null>(null);

  return (
    <nav className="tabs">
      <Action name="back-button" icon="chevron-left" navigate="/" />

      {gist.files.map(file => (
        <FileTab
          key={file.name}
          file={file}
          isActive={file === active}
          onSelect={onChange}
          onRename={name => file.rename(name)}
        />
      ))}

      {newFileName == null ? (
        <Action
          name="new-file"
          icon="plus"
          onClick={() => setNewFileName('Filename.md')}
        />
      ) : (
        <FileTab onSubmit={addFile} onAbort={() => setNewFileName(null)} />
      )}

      <div className="spacer"></div>

      <Action
        name="gh-link"
        icon="github"
        target="_blank"
        href={gist.htmlUrl}
      />
    </nav>
  );

  function addFile(name: string) {
    setNewFileName(null);

    return gist.addFile(name).then(x => {
      const file = x.getFileByName(name) as GistFile;
      history.push(file.path);
      return file;
    });
  }
}
