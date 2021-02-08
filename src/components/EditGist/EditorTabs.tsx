import React from 'react';
import { Link } from 'react-router-dom';
import { FileTab } from './FileTab';
import { GistFile } from '../../model/GistFile';

export function EditorTabs({
  files,
  active,
  onChange,
}: {
  files: GistFile[];
  active: GistFile;
  onChange: (file: GistFile) => void;
}) {
  return (
    <nav className="tabs">
      <Link to="/">
        <button className="back-button">◀️</button>
      </Link>

      {files.map(file => (
        <FileTab
          key={file.name}
          file={file}
          isActive={file === active}
          onSelect={onChange}
          onRename={name => file.rename(name)}
        />
      ))}

      <div className="spacer" draggable="true"></div>
    </nav>
  );
}
