import './GistList.scss';

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Gist } from '../contracts/Gist';
import { getFiles } from '../contracts/Gist-methods';
import { GistFile } from '../contracts/GistFile';
import { UserName } from '../contracts/type-aliases';
import { getGistsByUser } from '../services/api';
import { getSetting, setSetting } from '../services/settings';
import { Resizer } from './Resizer';

export function GistList() {
  const [size, setSize] = useState(getSetting('sidebarWidth'));
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
      <Resizer size={size} onChange={onSidebarWidthChange} />
    </aside>
  );

  function onSidebarWidthChange(width: number) {
    setSize(width);
    setSetting('sidebarWidth', width)
  }
}

function GistItem({ gist }: { gist: Gist }) {
  const date = gist.created_at.split('T')[0];
  const title = gist.description ? `${date} - ${gist.description}` : date;
  const files = getFiles(gist);
  const extraClasses = files.length === 1 ? 'one-file':  '';

  return (
    <li className={`gist-item ${extraClasses}`}>
      <h4>{title}</h4>
      <ol className="file-list">
        {files.map(file => <GistFileItem key={file.filename} gist={gist} file={file} />)}
      </ol>
    </li>
  );
}

function GistFileItem({ gist, file }: { gist: Gist, file: GistFile }) {
  return (
      <li className="file-item">
        <Link to={`/${gist.id}/${file.filename}`}>
          {file.filename}
        </Link>
      </li>
    );
  }
}