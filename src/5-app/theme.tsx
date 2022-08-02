import { css } from '@emotion/react';
import Color from 'colorjs.io';
import { desktopOnly, mobileOnly } from '../0-dom/responsive';

const color = (hex: string) => (l?: number) => {
  if (!l) return hex;
  const color = new Color(hex).to('lch');
  color.set('l', color.l + l);
  return color.to('sRGB').toString();
};

const fg = color('#c4c4c4');
const bg = color('rgb(30, 30, 30)');
const sidebar = color('#252526');
const border = color('#343637');
const primary = color('#669bd1');
const secondary = color('#f2f230');
// const secondary = color('#d16014');
// const secondary = color('#c9866e');

export const globalStyles = css`
  #app-container {
    color: var(--fg-color);
    background-color: var(--bg-color);
    width: 100vw;
    height: 100vh;

    &.is-virtual-keyboard-open .mobile-fallback {
      height: 50%;
    }

    --animation-speed: 0.25s;
    --group-border-width: 2px;
    --status-line-width: var(--group-border-width);
    --status-line-color: transparent;

    ${mobileOnly} {
      --sidebar-font-size: 1rem;
      --sidebar-gap: 0.5rem;
    }

    ${desktopOnly} {
      --sidebar-font-size: 0.9rem;
      --sidebar-gap: 0.4rem;
    }

    --fg-color: ${fg()};
    --fg-color-active: ${fg(100)};

    --bg-color: ${bg()};
    --bg-color-sidebar: ${sidebar()};
    --bg-color-control: ${bg(-2)};
    --bg-color-hover: ${bg(10)};
    --border-color: ${border()};

    --bg-color-active: ${primary(-20)};
    --border-color-active: ${primary(0)};

    --note-item-color: ${bg(2)};
    --favorite-color: ${secondary()};

    --group-color: var(--bg-color-sidebar);
    --group-active-color: ${primary(-30)};
    --group-border-color: ${secondary(-30)};
  }
`;
