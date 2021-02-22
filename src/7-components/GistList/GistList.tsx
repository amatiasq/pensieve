import './GistList.scss';

import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { registerCommand } from '../../1-core/commands';
import { createAndNavigateToGist } from '../../3-gist/createAndNavigateToGist';
import { Gist } from '../../3-gist/Gist';
import { useGistList } from '../../6-hooks/useGistList';
import { useSetting } from '../../6-hooks/useSetting';
import { useStarredGists } from '../../6-hooks/useStarredGists';
import StringComparer from '../../util/StringComparer';
import { Action } from '../atoms/Action';
import { Resizer } from '../atoms/Resizer';
import { FilterBox } from './FilterBox';
import { GistItem } from './GistItem';

export function GistList() {
  const [loadMore, setLoadMore] = useState(true);
  const [filter, setFilter] = useState<StringComparer | null>(null);

  const [isVisible, setIsVisible] = useSetting('sidebarVisible');
  const [size, setSize] = useSetting('sidebarWidth');

  const history = useHistory();
  const starred = useStarredGists();
  const gists = useGistList(loadMore);

  const starredIds = starred.map(x => x.id);
  const allGists = [
    ...starred,
    ...gists.filter(x => !starredIds.includes(x.id)),
  ];
  const filtered = filter ? applyFilter(allGists, filter) : allGists;

  registerCommand('createGist', () => createAndNavigateToGist(history));

  useEffect(() => {
    setLoadMore(false);
  }, [gists.length]);

  registerCommand('hideSidebar', () => setIsVisible(!isVisible));

  const content = filtered.length ? (
    filtered.map(gist => <GistItem key={gist.id} gist={gist} />)
  ) : filter ? (
    <li>No Results</li>
  ) : (
    <li>No gists</li>
  );

  return (
    <aside style={{ width: size, display: isVisible ? '' : 'none' }}>
      <ul className="gist-list" onScroll={onScroll}>
        <li className="filter">
          <FilterBox onChange={setFilter} />
          <Action
            name="add-gist"
            icon="plus"
            onClick={() => createAndNavigateToGist(history)}
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
