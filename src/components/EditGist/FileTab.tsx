import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { GistFile } from '../../model/GistFile';
import { InputField } from './InputField';

export function FileTab({
  file,
  isActive,
  onSelect,
  onRename,
}: {
  file: GistFile;
  isActive: boolean;
  onSelect(file: GistFile): void;
  onRename(name: string): Promise<GistFile>;
}) {
  const history = useHistory();
  const [isRenaming, setIsRenaming] = useState(false);
  const classNames = `file-tab ${isActive ? 'active' : ''}`;

  return (
    <div
      className={classNames}
      onClick={() => onSelect(file)}
      onDoubleClick={() => setIsRenaming(true)}
    >
      <InputField
        className="tab-name"
        value={file.name}
        editable={isRenaming}
        onSubmit={rename}
        onAbort={() => setIsRenaming(false)}
      />

      <button className="remove" onClick={remove}>
        <i className="fas fa-times"></i>
      </button>
    </div>
  );

  function rename(name: string) {
    if (name !== file.name) {
      onRename(name).then(file => history.push(file.path));
    }

    setIsRenaming(false);
  }

  function remove() {
    const message = file.isOnlyFile
      ? 'Permanently delete THE GIST?'
      : `Permanently remove ${file.name}?`;

    if (confirm(message)) {
      return file
        .remove()
        .then(gist => history.push(gist == null ? '/' : gist.files[0].path));
    }
  }
}
