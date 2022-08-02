import { css } from '@emotion/react';
import styled from '@emotion/styled';

export const iconContainerStyles = css`
  --size: 2rem;
  line-height: var(--size);
  height: var(--size);
  width: var(--size);
  border-radius: 100%;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    fill: var(--fg-color);
  }
`;

export const IconContainer = styled.div(iconContainerStyles);
