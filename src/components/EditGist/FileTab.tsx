import './FileTab.scss';

import React from 'react';
import { Link, useHistory } from 'react-router-dom';

import { GistFile } from '../../model/GistFile';
import { Action } from '../atoms/Action';
import { InputField } from '../atoms/InputField';

interface FileTabProps {
  file: GistFile;
  isActive: boolean;
  readonly?: boolean;
  onRename(name: string): Promise<GistFile>;
}

export function FileTab(props: FileTabProps) {
  const history = useHistory();
  const remove = () =>
    file.removeWithConfirm().then(path => history.push(path));

  const { file, isActive, onRename } = props;
  const classNames = `file-tab ${isActive ? 'active' : ''}`;

  return (
    <Link className={classNames} to={file.path}>
      <InputField
        className="file-tab--tab-name"
        value={file.name}
        readonly={props.readonly}
        onSubmit={rename}
      />

      <Action name="file-tab--remove" icon="trash" onClick={remove} />
    </Link>
  );

  function rename(name: string) {
    if (name !== file.name) {
      onRename(name).then(file => history.push(file.path));
    }
  }
}
