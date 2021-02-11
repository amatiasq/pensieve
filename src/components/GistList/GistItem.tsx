import './GistItem.scss';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { Gist } from '../../model/Gist';
import { GistFile } from '../../model/GistFile';
import { updateGist } from '../../services/github_api';
import { InputField } from '../EditGist/InputField';

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
            <Link
              className="gist-item--link"
              to={`/gist/${gist.id}/${file.name}`}
            >
              <InputField
                className="gist-item--file"
                value={print(file.name)}
                onSubmit={name => renameFile(file, name)}
              />
            </Link>
          </li>
        ))}
      </ol>
    </li>
  );

  function renameFile(file: GistFile, newName: string) {
    return file.rename(
      file.name.startsWith(title) ? `${title} ${newName}` : newName,
    );
  }

  function print(name: string) {
    return name.startsWith(title) ? name.substr(title.length).trim() : name;
  }
}
