import React from 'react';

import { Gist } from '../../model/Gist';
import { GistFileItem } from './GistFileItem';

export function GistItem({ gist }: { gist: Gist }) {
  const { date, files } = gist;
  const title = gist.description ? `${date} - ${gist.description}` : date;
  const extraClasses = files.length === 1 ? 'one-file' : '';

  return (
    <li className={`gist-item ${extraClasses}`}>
      <h4>{title}</h4>
      <ol className="file-list">
        {files.map(file => (
          <GistFileItem key={file.name} gist={gist} file={file} />
        ))}
      </ol>
    </li>
  );
}
