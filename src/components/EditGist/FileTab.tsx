import React, { useState } from 'react';
import { GistFile } from '../../model/GistFile';

export function FileTab({
  file,
  isActive,
  onSelect,
  onRename,
}: {
  file: GistFile;
  isActive: boolean;
  onSelect(file: GistFile): void;
  onRename(name: string): void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(file.name);

  return (
    <button
      className={isActive ? 'active' : ''}
      onClick={() => onSelect(file)}
      onDoubleClick={() => setIsRenaming(true)}
    >
      <input
        type="text"
        className="rename-field"
        style={{ width: file.name.length + 'ch' }}
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
    if (name !== file.name) {
      onRename(name);
    }

    setIsRenaming(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      rename();
    }

    if (event.key === 'Escape') {
      setName(file.name);
      setIsRenaming(false);
    }
  }
}
