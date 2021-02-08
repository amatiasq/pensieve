import React from 'react';
import { Link } from 'react-router-dom';

import { Gist } from '../../model/Gist';
import { GistFile } from '../../model/GistFile';

export function GistFileItem({ gist, file }: { gist: Gist; file: GistFile }) {
  const { name } = file;
  const { date } = gist;

  const printName = name.startsWith(date)
    ? name.substr(date.length).trim()
    : name;

  return (
    <li className="file-item">
      <Link to={`/${gist.id}/${file.name}`}>{printName}</Link>
    </li>
  );
}
