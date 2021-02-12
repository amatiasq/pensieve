import './GistItem.scss';

import React, { useState } from 'react';

import { Gist } from '../../model/Gist';
import { updateGist } from '../../services/github_api';
import { Action } from '../atoms/Action';
import { InputField } from '../atoms/InputField';

export function GistItem({ gist }: { gist: Gist }) {
  const { date, files } = gist;
  const [title, setTitle] = useState(gist.description || date);
  const extraClasses = files.length === 1 ? 'one-file' : '';

  const setDescription = (description: string) => {
    updateGist(gist.id, { description }).then(() =>
      setTitle(description || date),
    );
  };

  return (
    <li className={`gist-item ${extraClasses}`}>
      <InputField
        className="gist-item--title"
        value={title}
        onSubmit={setDescription}
      />
      <ol className="gist-item--file-list">
        {files.map(file => (
          <li key={file.name} className="gist-item--file-item">
            <Action
              name="gist-item--link"
              navigate={`/gist/${gist.id}/${file.name}`}
            >
              <div className="gist-item--file">{print(file.name)}</div>
            </Action>
          </li>
        ))}
      </ol>
    </li>
  );

  function print(name: string) {
    return name.startsWith(title) ? name.substr(title.length).trim() : name;
  }
}
