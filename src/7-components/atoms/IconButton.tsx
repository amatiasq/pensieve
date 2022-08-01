import { css } from '@emotion/react';
import { Button, ButtonProps } from './Button';
import { Icon } from './Icon';

export interface IconButtonProps extends ButtonProps {
  icon: JSX.Element | string;
}

export function IconButton(props: IconButtonProps) {
  const { icon, ...buttonProps } = props;

  const styles = css`
    --size: 2rem;
    line-height: var(--size);
    height: var(--size);
    width: var(--size);
    border-radius: 100%;
    text-align: center;
    color: #b7b7b7;

    :hover {
      background: rgb(255 255 255 / 0.2);
    }

    svg {
      fill: var(--fg-color);
    }
  `;

  const foo = typeof icon === 'string' ? <Icon name={icon} /> : icon;

  return (
    <Button {...buttonProps} css={styles}>
      {foo}
    </Button>
  );
}
