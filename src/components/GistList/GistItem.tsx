import './GistItem.scss';

import React, { useState } from 'react';

import { useStar } from '../../hooks/useStar';
import { Gist } from '../../model/Gist';
import { GistFile } from '../../model/GistFile';
import { updateGist } from '../../services/github_api';
import { Action } from '../atoms/Action';
import { InputField } from '../atoms/InputField';

export function GistItem({ gist }: { gist: Gist }) {
  const { date, files } = gist;
  const [title, setTitle] = useState(gist.description || date);
  const isStarred = useStar(gist.id);
  const extraClasses = isStarred ? 'starred' : '';

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
        {fileLink(files[0])}
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

      <ol className="gist-item--file-list">
        {files.map(file => (
          <li key={file.name}>{fileLink(file)}</li>
        ))}
      </ol>
    </li>
  );

  function fileLink(file: GistFile) {
    return (
      <Action name="gist-item--link" navigate={file.path}>
        <div className="gist-item--file">{print(file.name)}</div>
      </Action>
    );
  }

  function print(name: string) {
    return name.startsWith(title) ? name.substr(title.length).trim() : name;
  }
}
