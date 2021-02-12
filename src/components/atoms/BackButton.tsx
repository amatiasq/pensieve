import React from 'react';
import { useHistory } from 'react-router-dom';

import { Action } from './Action';

export function BackButton() {
  const history = useHistory();
  const isHome = history.location.pathname === '/';

  return (
    <Action
      name="back"
      icon="chevron-left"
      disabled={isHome}
      onClick={() => history.goBack()}
      square
    />
  );
}
