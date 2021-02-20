import React from 'react';
import { useHistory } from 'react-router-dom';

import { registerCommand } from '../1-core/commands';
import { Action } from './atoms/Action';

export function BackButton() {
  const history = useHistory();
  const isHome = history.location.pathname === '/';

  registerCommand('goBack', () => history.goBack());
  registerCommand('goForward', () => history.goForward());
  registerCommand('goHome', () => history.push('/'));

  return (
    <Action
      name="back"
      icon="chevron-left"
      disabled={isHome}
      onClick={() => history.push('/')} //{() => history.goBack()}
      square
    />
  );
}
