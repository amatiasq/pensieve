import './GistItem.scss';

import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { Gist } from '../../model/Gist';
import { GistFile } from '../../model/GistFile';
import { useStar } from '../../services/gist/starred';
import { updateGist } from '../../services/github_api';
import { Action } from '../atoms/Action';
import { InputField } from '../atoms/InputField';

export function GistItem({ gist }: { gist: Gist }) {
  const { date, files } = gist;

  const [title, setTitle] = useState(gist.description || date);

  const isStarred = useStar(gist.id);
  const history = useHistory();
  const extraClasses = isStarred ? 'starred' : '';

  const remove = (file: GistFile) =>
    file.removeWithConfirm().then(path => history.push(path));

  const setDescription = (description: string) => {
    updateGist(gist.id, { description }).then(() =>
      setTitle(description || date),
    );
  };

  const input = (
    <InputField
      className="gist-item--title"
      value={title}
      onSubmit={setDescription}
    />
  );

  const actions = (
    <div className="gist-item--actions">
      <Action
        name="gist-item--add-file"
        icon="plus"
        navigate={gist.createFilePath}
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
        <div className="gist-item--file">{fileLink(files[0])}</div>
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
            {fileLink(file)}
          </li>
        ))}
      </ol>
    </li>
  );

  function fileLink(file: GistFile) {
    return (
      <>
        <Action name="gist-item--link" navigate={file.path}>
          <div className="gist-item--filename">{print(file.name)}</div>
        </Action>
        <div className="gist-item--file-actions">
          <Action
            name="gist-item--trash"
            icon="trash"
            onClick={() => remove(file)}
          />
        </div>
      </>
    );
  }

  function print(name: string) {
    return name.startsWith(title) ? name.substr(title.length).trim() : name;
  }
}
