import { css } from '@emotion/react';
import { forwardRef } from 'react';
import { Button, ButtonProps } from './Button';
import { interactiveIconStyles } from './icons';

export interface IconButtonProps extends ButtonProps {
  icon: JSX.Element;
}

export const IconButton = forwardRef(function IconButton(
  props: IconButtonProps,
  ref: any,
) {
  const { icon, ...buttonProps } = props;

  const styles = css`
    ${interactiveIconStyles}
    color: #b7b7b7;
  `;

  return (
    <Button {...buttonProps} ref={ref} css={styles}>
      {icon}
    </Button>
  );
});
