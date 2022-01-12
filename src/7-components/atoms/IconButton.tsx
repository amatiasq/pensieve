import React from 'react';
import { Button, ButtonProps } from './Button';
import { Icon } from './Icon';
import './IconButton.scss';

export function IconButton(props: ButtonProps & { icon: string }) {
  const { icon, className, ...buttonProps } = props;

  const classes = `icon-button ${className || ''}`;

  return (
    <Button {...buttonProps} className={classes}>
      <Icon name={icon} />
    </Button>
  );
}
