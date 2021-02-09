import './GistItem.scss';

import React from 'react';
import { Link } from 'react-router-dom';

import { Gist } from '../../model/Gist';

export function GistItem({ gist }: { gist: Gist }) {
  const { date, files } = gist;
  const title = gist.description ? `${date} - ${gist.description}` : date;
  const extraClasses = files.length === 1 ? 'one-file' : '';

  return (
    <li className={`gist-item ${extraClasses}`}>
      <h4 className="gist-item--title">{title}</h4>
      <ol className="gist-item--file-list">
        {files.map(({ name }) => (
          <li className="gist-item--file-item">
            <Link className="gist-item--link" to={`/${gist.id}/${name}`}>
              {print(name)}
            </Link>
          </li>
        ))}
      </ol>
    </li>
  );

  function print(name: string) {
    return name.startsWith(date) ? name.substr(date.length).trim() : name;
  }
}
