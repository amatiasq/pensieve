import { css } from '@emotion/react';
import { Button, ButtonProps } from './Button';
import { Icon } from './Icon';
import { interactiveIconStyles } from './icons';

export interface IconButtonProps extends ButtonProps {
  icon: JSX.Element | string;
}

export function IconButton(props: IconButtonProps) {
  const { icon, ...buttonProps } = props;

  const styles = css`
    ${interactiveIconStyles}
    color: #b7b7b7;
  `;

  const foo = typeof icon === 'string' ? <Icon name={icon} /> : icon;

  return (
    <Button {...buttonProps} css={styles}>
      {foo}
    </Button>
  );
}
