import './GistList.scss';

import React, { useEffect, useState } from 'react';

import { useGists } from '../../hooks/useGists';
import { useSetting } from '../../hooks/useSetting';
import { Resizer } from '../Resizer';
import { GistItem } from './GistItem';
import StringComparer from '../../util/StringComparer';
import { FilterBox } from './FilterBox';
import { Gist } from '../../model/Gist';
import { useHistory } from 'react-router-dom';

export function GistList() {
  const history = useHistory();
  const [loadMore, setLoadMore] = useState(true);
  const [size, setSize] = useSetting('sidebarWidth');
  const [filter, setFilter] = useState<StringComparer | null>(null);
  const gists = useGists(loadMore);

  const filtered = filter
    ? gists.filter(gist => gist.files.some(x => filter.matches(x.name)))
    : gists;

  useEffect(() => {
    setLoadMore(false);
  }, [gists.length]);

  const content = filtered.length ? (
    filtered.map(gist => <GistItem key={gist.id} gist={gist} />)
  ) : filter ? (
    <li>No Results</li>
  ) : (
    <li>Loading...</li>
  );

  return (
    <aside style={{ width: size }} onScroll={onScroll}>
      <ul className="gist-list">
        <li className="filter">
          <FilterBox onChange={setFilter} />
          <button className="add-gist" onClick={addGist}>
            <i className="fas fa-plus"></i>
          </button>
        </li>

        {content}
      </ul>
      <Resizer size={size} onChange={setSize} />
    </aside>
  );

  function addGist() {
    Gist.create().then(x => history.push(x.files[0].path));
  }

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
