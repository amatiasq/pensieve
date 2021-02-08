import './GistList.scss';

import React, { useEffect, useState } from 'react';

import { Gist } from '../contracts/Gist';
import { getFiles } from '../contracts/Gist-methods';
import { UserName } from '../contracts/type-aliases';
import { getGistsByUser } from '../services/api';
import { Link } from 'react-router-dom';
import { GistFile } from '../contracts/GistFile';

export function GistList() {
  const [gists, setGists] = useState<Gist[]>([]);

  useEffect(() => {
    getGistsByUser('amatiasq' as UserName).then(setGists);
  }, []);

  if (!gists.length) {
    return <p>Loading...</p>;
  }

  return (
    <ul className="gist-list">
      {gists.map(gist => (
        <GistItem key={gist.id} gist={gist}></GistItem>
      ))}
    </ul>
  );
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