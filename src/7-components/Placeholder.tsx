import './Placeholder.scss';

import React from 'react';

export function Placeholder() {
  return <p>Placeholder</p>;

  // const [welcomeGist] = useSetting('welcomeGist');
  // const note = useNote(welcomeGist);

  // if (!note) {
  //   return <p>Loading...</p>;
  // }

  // return (
  //   <main className="placeholder">
  //     <GistEditor gist={note} file={note.defaultFile} readonly />
  //   </main>
  // );
}
