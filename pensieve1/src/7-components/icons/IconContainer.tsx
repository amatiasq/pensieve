import { css } from '@emotion/react';
import styled from '@emotion/styled';

export const iconContainerStyles = css`
  --size: 2rem;
  line-height: var(--size);
  height: var(--size);
  width: var(--size);
  border-radius: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg.fill {
    stroke: transparent;
    fill: var(--fg-color);
  }

  svg.stroke {
    fill: transparent;
    stroke: var(--fg-color);
    stroke-linejoin: round;
  }
`;

export const IconContainer = styled.div(iconContainerStyles);
