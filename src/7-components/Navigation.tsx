import React from 'react';
import { Link } from 'react-router-dom';

import { useTags } from '../6-hooks/useTags';

export function Navigation() {
  const tags = useTags();

  return (
    <nav>
      <Link to="/new">➕</Link>
      <Link to="/sketch">📝</Link>
      <Link to="/all-notes">*️⃣</Link>
      <Link to="/favorites">⭐️</Link>
      <Link to="/trash">🗑</Link>
      <Link to="/settings">⚙️</Link>

      <details open>
        <summary>
          <h3>Tags</h3>
          <button onClick={createCategory}>➕</button>
        </summary>
        <ul>
          {tags.map(x => (
            <li>
              <Link to={`/tag/${x.id}`}>{x.name}</Link>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );

  function createCategory() {
    alert(prompt('Category name'));
  }
}
