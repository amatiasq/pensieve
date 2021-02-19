import './FileTab.scss';

import React from 'react';
import { Link, useHistory } from 'react-router-dom';

import { GistFile } from '../../3-gist/GistFile';
import { Action } from '../atoms/Action';
import { InputField } from '../atoms/InputField';

interface FileTabProps {
  file: GistFile;
  isActive: boolean;
  readonly?: boolean;
  onRename(name: string): Promise<GistFile>;
}

export function FileTab({ file, readonly, isActive, onRename }: FileTabProps) {
  const history = useHistory();
  const remove = () =>
    file.removeWithConfirm().then(path => history.push(path));

  const classNames = `file-tab ${isActive ? 'active' : ''}`;

  return (
    <Link className={classNames} to={file.path}>
      <InputField
        className="file-tab--tab-name"
        value={file.name}
        readonly={readonly}
        onSubmit={rename}
      />

      <Action name="file-tab--remove" icon="trash" onClick={remove} />
    </Link>
  );

  async function rename(name: string) {
    if (name !== file.name) {
      const file = await onRename(name);
      history.push(file.path);
    }
  }
}
