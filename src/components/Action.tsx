import './Action.scss';

import React from 'react';
import { Link } from 'react-router-dom';

interface BaseActionProps {
  name?: string;
  icon: string;
}

interface InteractiveActionProps extends BaseActionProps {
  onClick: () => void;
}

interface LinkActionProps extends BaseActionProps {
  href: string;
  target?: string;
}

interface RouterActionProps extends BaseActionProps {
  navigate: string;
}

export type ActionProps =
  | InteractiveActionProps
  | LinkActionProps
  | RouterActionProps;

export function Action(props: ActionProps) {
  const { name, icon } = props;
  const cn = `action ${name || ''}`;
  const fa = icon === 'github' ? 'fab' : 'fas';
  const iconEl = <i className={`action--icon ${fa} fa-${icon}`}></i>;

  if (isButtonAction(props)) {
    return (
      <button className={cn} onClick={props.onClick}>
        {iconEl}
      </button>
    );
  }

  if (isLinkAction(props)) {
    return (
      <a className={cn} target={props.target} href={props.href}>
        {iconEl}
      </a>
    );
  }

  if (isRouterAction(props)) {
    return (
      <Link className={cn} to={props.navigate}>
        {iconEl}
      </Link>
    );
  }

  throw new Error('Invalid props for <Action />');
}

function isButtonAction(props: ActionProps): props is InteractiveActionProps {
  return 'onClick' in props;
}

function isLinkAction(props: ActionProps): props is LinkActionProps {
  return 'href' in props;
}

function isRouterAction(props: ActionProps): props is RouterActionProps {
  return 'navigate' in props;
}
