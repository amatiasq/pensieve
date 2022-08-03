export const ellipsis = css`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;
import { css } from '@emotion/react';

export const hideScrollbar = css`
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const hStack = css`
  --gap: 1rem;

  display: flex;
  align-items: center;
  gap: var(--gap);
  padding: 0 var(--gap);
`;
