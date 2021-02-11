import './Action.scss';

import React, { createRef, PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

interface BaseActionProps {
  name?: string;
  icon: string;
  square?: boolean;
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

export function Action(props: PropsWithChildren<ActionProps>) {
  const { name, square } = props;
  const [prefix, icon] = props.icon.includes(' ')
    ? props.icon.split(' ')
    : ['fas', props.icon];

  const iconEl = <i className={`action--icon ${prefix} fa-${icon}`}></i>;
  const title = name && name.split('--').pop();

  return (
    <div
      className={`action ${name || ''} ${square ? 'square' : ''}`}
      title={title}
    >
      {getUserControl('action--trigger')}
    </div>
  );

  function getUserControl(cn: string) {
    if (isButtonAction(props)) {
      return (
        <button className={cn} onClick={props.onClick}>
          {iconEl}
          {props.children}
        </button>
      );
    }

    if (isLinkAction(props)) {
      return (
        <a className={cn} target={props.target} href={props.href}>
          {iconEl}
          {props.children}
        </a>
      );
    }

    if (isRouterAction(props)) {
      return (
        <Link className={cn} to={props.navigate}>
          {iconEl}
          {props.children}
        </Link>
      );
    }

    throw new Error('Invalid props for <Action />');
  }
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
