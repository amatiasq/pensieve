import './Action.scss';

import React, { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

import { copyToClipboard } from '../../dom/copyToClipboard';
import { tooltip } from '../../dom/tooltip';
import { useLongPress } from '../../hooks/useLongPress';
import { Icon } from './Icon';

type Event = React.MouseEvent<HTMLAnchorElement, MouseEvent>;

interface BaseActionProps {
  name: string;
  icon?: string;
  square?: boolean;
  disabled?: boolean;
  className?: string;
  onLongPress?: () => void;
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
  const { name, square, disabled, onLongPress } = props;
  const title = name.split('--').pop();

  const icon = props.icon ? (
    <Icon name={props.icon} className="action--icon" />
  ) : null;

  const longPress = useLongPress(() => {
    share();

    if (onLongPress) {
      onLongPress();
    }
  });

  const cn = [
    'action',
    name,
    square ? 'square' : null,
    icon ? 'has-icon' : null,
    disabled ? 'disabled' : null,
    props.className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cn} title={title} {...longPress}>
      {getUserControl('action--trigger')}
    </div>
  );

  function share() {
    const url = isLinkAction(props)
      ? props.href
      : isRouterAction(props)
      ? `${location.origin}${props.navigate}`
      : null;

    if (!url) return;

    if (typeof navigator.share === 'function') {
      navigator.share({ title, url });
    } else {
      copyToClipboard(url);
      tooltip('URL copied to clipboard', 'bottom');
    }
  }

  function getUserControl(cn: string) {
    if (isButtonAction(props)) {
      return (
        <button className={cn} disabled={disabled} onClick={props.onClick}>
          {icon}
          {props.children}
        </button>
      );
    }

    const onClick = disabled ? (e: Event) => e.preventDefault() : undefined;

    if (isLinkAction(props)) {
      return (
        <a
          className={cn}
          target={props.target}
          href={props.href}
          onClick={onClick}
        >
          {icon}
          {props.children}
        </a>
      );
    }

    if (isRouterAction(props)) {
      return (
        <Link className={cn} to={props.navigate} onClick={onClick}>
          {icon}
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
