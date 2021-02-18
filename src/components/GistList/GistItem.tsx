import './GistItem.scss';

import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useSetting } from '../../hooks/useSetting';
import { Gist } from '../../model/Gist';
import { GistFile } from '../../model/GistFile';
import { useStar } from '../../services/gist/starred';
import { updateGist } from '../../services/github_api';
import { Action } from '../atoms/Action';
import { InputField } from '../atoms/InputField';

export function GistItem({ gist }: { gist: Gist }) {
  const [title, setTitle] = useState(gist.description || gist.date);

  const isStarred = useStar(gist.id);
  const [username] = useSetting('username');
  const history = useHistory();

  const { files } = gist;
  const extraClasses = isStarred ? 'starred' : '';
  const readonly = !gist.isOwner(username);

  const remove = (file: GistFile) =>
    file.removeWithConfirm().then(path => history.push(path));

  const setDescription = (description: string) => {
    updateGist(gist.id, { description }).then(() =>
      setTitle(description || gist.date),
    );
  };

  const input = (
    <InputField
      className="gist-item--title"
      value={title}
      onSubmit={setDescription}
    />
  );

  const actions = readonly ? null : (
    <div className="gist-item--actions">
      <Action
        name="gist-item--add-file"
        icon="plus"
        onClick={() => gist.addFile().then(file => history.push(file.path))}
      />
      <Action
        name="gist-item--star"
        icon={isStarred ? 'star' : 'far star'}
        onClick={() => gist.toggleStar()}
      />
    </div>
  );

  if (files.length === 1) {
    return (
      <li className={`gist-item single-file ${extraClasses}`}>
        {input}
        <div className="gist-item--file">{fileLink(files[0], readonly)}</div>
        {actions}
      </li>
    );
  }

  return (
    <li className={`gist-item multiple-files ${extraClasses}`}>
      <header className="gist-item--header">
        {input}
        {actions}
      </header>

      <ol>
        {files.map(file => (
          <li key={file.name} className="gist-item--file">
            {fileLink(file, readonly)}
          </li>
        ))}
      </ol>
    </li>
  );

  function fileLink(file: GistFile, readonly: boolean) {
    return (
      <>
        <Action name="gist-item--link" navigate={file.path}>
          <div className="gist-item--filename">{print(file.name)}</div>
        </Action>
        {readonly ? null : (
          <div className="gist-item--file-actions">
            <Action
              name="gist-item--trash"
              icon="trash"
              onClick={() => remove(file)}
            />
          </div>
        )}
      </>
    );
  }

  function print(name: string) {
    return name.startsWith(title) ? name.substr(title.length).trim() : name;
  }
}
