import styled from '@emotion/styled';
import { forwardRef } from 'react';
import { iconContainerStyles } from '../icons/IconContainer';
import { Button, ButtonProps } from './Button';

const StyledButton = styled(Button)`
  ${iconContainerStyles};
  color: #b7b7b7;

  :hover {
    background: rgb(255 255 255 / 0.2);
  }
`;

export interface IconButtonProps extends ButtonProps {
  icon: JSX.Element;
}

export const IconButton = forwardRef(function IconButton(
  props: IconButtonProps,
  ref: any,
) {
  const { icon, ...buttonProps } = props;

  return (
    <StyledButton {...buttonProps} ref={ref}>
      {icon}
    </StyledButton>
  );
});
