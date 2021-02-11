import './FileTab.scss';

import React from 'react';
import { useHistory } from 'react-router-dom';

import { GistFile } from '../../model/GistFile';
import { Action } from '../Action';
import { InputField } from './InputField';

interface ExistingFileProps {
  file: GistFile;
  isActive: boolean;
  readonly?: boolean;
  onSelect(file: GistFile): void;
  onRename(name: string): Promise<GistFile>;
}

interface CreateFileProps {
  onSubmit(name: string): void;
  onAbort(): void;
}

type FileTabProps = ExistingFileProps | CreateFileProps;

export function FileTab(props: FileTabProps) {
  const history = useHistory();

  if (isCreateFile(props)) {
    return (
      <div className="file-tab active">
        <InputField
          className="file-tab--tab-name"
          value="type a file name.md"
          forceEditMode={true}
          onSubmit={props.onSubmit}
          onAbort={props.onAbort}
        />
      </div>
    );
  }

  const { file, isActive, onSelect, onRename } = props;
  const classNames = `file-tab ${isActive ? 'active' : ''}`;

  return (
    <div
      className={classNames}
      onClick={isActive ? undefined : () => onSelect(file)}
    >
      <InputField
        className="file-tab--tab-name"
        value={file.name}
        readonly={props.readonly}
        onSubmit={rename}
      />

      <Action name="file-tab--remove" icon="times" onClick={remove} />
    </div>
  );

  function rename(name: string) {
    if (name !== file.name) {
      onRename(name).then(file => history.push(file.path));
    }
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

function isCreateFile(props: FileTabProps): props is CreateFileProps {
  return !('file' in props);
}
