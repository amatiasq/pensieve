import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import { Gist } from '../../model/Gist';
import { GistFile } from '../../model/GistFile';
import { FileTab } from './FileTab';
import { InputField } from './InputField';

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
      <Link to="/">
        <button className="back-button">
          <i className="fas fa-chevron-left"></i>
        </button>
      </Link>

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
        <button
          className="new-file"
          onClick={() => setNewFileName('Filename.md')}
        >
          <i className="fas fa-plus"></i>
        </button>
      ) : (
        <button className="active">
          <InputField
            className="tab-name"
            value="type a file name.md"
            editable={true}
            onSubmit={addFile}
            onAbort={() => setNewFileName(null)}
          />
        </button>
      )}

      <span className="spacer"></span>

      <a className="external-link" target="_blank" href={gist.htmlUrl}>
        <i className="fab fa-github"></i>
      </a>
    </nav>
  );

  function addFile(name: string) {
    setNewFileName(null);
    gist
      .addFile(name)
      .then(x => history.push((x.getFileByName(name) as GistFile).path));
  }
}
