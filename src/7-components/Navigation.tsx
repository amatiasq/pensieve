import React from 'react';
import { Link } from 'react-router-dom';

import { Tag } from '../entities/Tag';

export function Navigation({ tags }: { tags: Tag[] }) {
  return (
    <nav>
      <Link to="/sketch">📝</Link>
      <Link to="/all-notes">*️⃣</Link>
      <Link to="/favorites">⭐️</Link>
      <Link to="/trash">🗑</Link>
      <Link to="/settings">⚙️</Link>

      <desc>
        <summary>
          <h3>Tags</h3>
        </summary>
        <ul>
          {tags.map(x => (
            <li>
              <Link to={`/tag/${x.id}`}>{x.name}</Link>
            </li>
          ))}
        </ul>
      </desc>
    </nav>
  );
}
