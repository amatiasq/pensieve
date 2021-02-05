import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gist } from '../contracts/Gist';
import { getFiles } from '../contracts/Gist-methods';
import { GistDetails } from '../contracts/GistDetails';
import { GistFile } from '../contracts/GistFile';
import { GistFileDetails } from '../contracts/GistFileDetails';
import { UserName } from '../contracts/type-aliases';
import { getGist, getGistsByUser } from '../services/api';

export function NotesList() {
  const [gists, setGists] = useState<Gist[]>([]);

  useEffect(() => {
    getGistsByUser('amatiasq' as UserName).then(setGists);
  }, []);

  if (!gists.length) {
    return <p>Loading...</p>;
  }

  return (
    <ul className="list">
      {gists.slice(0, 5).map(x => (
        <GistCard key={x.id} gist={x} />
      ))}
    </ul>
  );
}

function GistCard({ gist }: { gist: Gist }) {
  const [details, setDetails] = useState<GistDetails>();

  useEffect(() => {
    getGist(gist.id).then(setDetails);
  }, [gist]);

  if (!details) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <div className="card">
        {getFiles(details).map(x => (
          <GistFileCard key={x.filename} {...x} />
        ))}
      </div>
      <footer className="card-footer">
        <Link className="card-footer-item" to={gist.id}>
          Edit
        </Link>
      </footer>
    </>
  );
}

function GistFileCard(file: GistFileDetails) {
  return (
    <>
      <div className="card-header">
        <p className="card-header-title">{file.filename}</p>
      </div>
      <div className="card-content">
        <div className="content">
          <pre>{file.content}</pre>
        </div>
      </div>
    </>
  );
}
