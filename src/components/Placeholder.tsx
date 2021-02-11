import './Placeholder.scss';

import React from 'react';

import { useGist } from '../hooks/useGist';
import { useSetting } from '../hooks/useSetting';
import { GistEditor } from './EditGist/GistEditor';

export function Placeholder() {
  const [welcomeGist] = useSetting('welcomeGist');
  const gist = useGist(welcomeGist);

  if (!gist) {
    return <p>Loading...</p>;
  }

  return (
    <main className="placeholder">
      <GistEditor gist={gist} file={gist.defaultFile} readonly />
    </main>
  );
}
