import './GistList.scss';

import React, { useEffect, useState } from 'react';

import { useGists } from '../../hooks/useGists';
import { useSetting } from '../../hooks/useSetting';
import { Resizer } from '../Resizer';
import { GistItem } from './GistItem';

export function GistList() {
  const [loadMore, setLoadMore] = useState(true);
  const [size, setSize] = useSetting('sidebarWidth');
  const gists = useGists(loadMore);

  useEffect(() => {
    setLoadMore(false);
  }, [gists.length]);

  if (!gists || !gists.length) {
    return <p>Loading...</p>;
  }

  return (
    <aside style={{ width: size }} onScroll={onScroll}>
      <ul className="gist-list">
        {gists.map(gist => (
          <GistItem key={gist.id} gist={gist} />
        ))}
      </ul>
      <Resizer size={size} onChange={setSize} />
    </aside>
  );

  function onScroll(event: React.UIEvent<HTMLElement, UIEvent>) {
    const SCROLL_OFFSET = 50;

    const {
      scrollTop,
      scrollHeight,
      clientHeight,
    } = event.target as HTMLElement;

    const isNearBottom =
      clientHeight + scrollTop + SCROLL_OFFSET > scrollHeight;

    if (isNearBottom) {
      setLoadMore(true);
    }
  }
}
