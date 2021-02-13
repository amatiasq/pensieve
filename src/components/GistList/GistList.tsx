import './GistList.scss';

import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useGists } from '../../hooks/useGists';
import { useSetting } from '../../hooks/useSetting';
import { Gist } from '../../model/Gist';
import { registerCommand } from '../../services/commands';
import StringComparer from '../../util/StringComparer';
import { Action } from '../atoms/Action';
import { Resizer } from '../atoms/Resizer';
import { FilterBox } from './FilterBox';
import { GistItem } from './GistItem';

export let createAndNavigateToGist: () => Promise<void>;

export function GistList() {
  const [loadMore, setLoadMore] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [filter, setFilter] = useState<StringComparer | null>(null);

  const history = useHistory();
  const [size, setSize] = useSetting('sidebarWidth');
  const gists = useGists(loadMore);
  const filtered = filter ? applyFilter(gists, filter) : gists;

  createAndNavigateToGist = () =>
    Gist.create().then(x => history.push(x.files[0].path));

  useEffect(() => {
    setLoadMore(false);
  }, [gists.length]);

  registerCommand('hideSidebar', () => setIsHidden(!isHidden));

  const content = filtered.length ? (
    filtered.map(gist => <GistItem key={gist.id} gist={gist} />)
  ) : filter ? (
    <li>No Results</li>
  ) : (
    <li>Loading...</li>
  );

  return (
    <aside style={{ width: size, display: isHidden ? 'null' : '' }}>
      <ul className="gist-list" onScroll={onScroll}>
        <li className="filter">
          <FilterBox onChange={setFilter} />
          <Action
            name="add-gist"
            icon="plus"
            onClick={createAndNavigateToGist}
          />
        </li>

        {content}
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

function applyFilter(list: Gist[], comparer: StringComparer) {
  return list.filter(gist => {
    return (
      comparer.matches(gist.description || '') ||
      gist.files.some(x => comparer.matches(x.name))
    );
  });
}
