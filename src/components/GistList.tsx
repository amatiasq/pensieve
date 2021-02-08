import './GistList.scss';

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Gist } from '../contracts/Gist';
import { getFiles, getGistDate } from '../contracts/Gist-methods';
import { GistFile } from '../contracts/GistFile';
import { UserName } from '../contracts/type-aliases';
import { getGistsByUser } from '../services/api';
import { Resizer } from './Resizer';
import { useSetting } from '../hooks/useSetting';

export function GistList() {
  const [size, setSize] = useSetting('sidebarWidth');
  const [gists, setGists] = useState<Gist[]>([]);

  useEffect(() => {
    getGistsByUser('amatiasq' as UserName).then(setGists);
  }, []);

  if (!gists.length) {
    return <p>Loading...</p>;
  }

  return (
    <aside style={{ width: size }}>
      <ul className="gist-list">
        {gists.map(gist => (
          <GistItem key={gist.id} gist={gist}></GistItem>
        ))}
      </ul>
      <Resizer size={size} onChange={setSize} />
    </aside>
  );
}

function GistItem({ gist }: { gist: Gist }) {
  const date = getGistDate(gist);
  const title = gist.description ? `${date} - ${gist.description}` : date;
  const files = getFiles(gist);
  const extraClasses = files.length === 1 ? 'one-file' : '';

  return (
    <li className={`gist-item ${extraClasses}`}>
      <h4>{title}</h4>
      <ol className="file-list">
        {files.map(file => (
          <GistFileItem key={file.filename} gist={gist} file={file} />
        ))}
      </ol>
    </li>
  );
}

function GistFileItem({ gist, file }: { gist: Gist; file: GistFile }) {
  const { filename } = file;
  const date = getGistDate(gist);
  const name = filename.startsWith(date)
    ? filename.substr(date.length).trim()
    : filename;

  return (
    <li className="file-item">
      <Link to={`/${gist.id}/${file.filename}`}>{name}</Link>
    </li>
  );
}
