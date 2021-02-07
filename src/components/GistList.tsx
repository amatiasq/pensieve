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
      {gists.slice(0, 5).map(gist => (
        <GistItem key={gist.id} gist={gist}></GistItem>
      ))}
    </ul>
  );
}

function GistItem({ gist }: { gist: Gist }) {
  return (
    <li key={gist.id} className="gist-item">
      <ol className="file-list">
        {getFiles(gist).map(file => <GistFileItem key={file.filename} gist={gist} file={file} />)}
      </ol>
    </li>
  );
}

function GistFileItem({ gist, file }: { gist: Gist, file: GistFile }) {
  return (
    <Link to={`/${gist.id}/${file.filename}`}>
      <li key={file.filename} className="file-item">
        {file.filename}
      </li>
      </Link>
    );
  }
}