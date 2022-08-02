import { css } from '@emotion/react';
import Color from 'colorjs.io';
import { desktopOnly } from '../0-dom/responsive';

const fg = new Color('#c4c4c4').to('lch');
const bg = new Color('#1c1c1c').to('lch');
const sidebar = new Color('#252526').to('lch');
const border = new Color('#343637').to('lch');
const primary = new Color('#669bd1').to('lch');
const secondary = new Color('#f2f230').to('lch');
// const secondary = new Color('#d16014');
// const secondary = new Color('#c9866e');

const rgba = (color: Color, l = 0) =>
  color
    .clone()
    .set('l', color.l + l)
    .to('sRGB')
    .toString();

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

    {mobileOnly} {
      --sidebar-font-size: 1rem;
      --sidebar-gap: 0.5rem;
    }

    ${desktopOnly} {
      --sidebar-font-size: 0.9rem;
      --sidebar-gap: 0.4rem;
    }

    --fg-color: ${rgba(fg)};
    --fg-color-active: ${rgba(fg, 100)};

    --bg-color: ${rgba(bg)};
    --bg-color-sidebar: ${rgba(sidebar)};
    --bg-color-control: ${rgba(bg, -2)};
    --bg-color-hover: ${rgba(bg, 10)};
    --border-color: ${rgba(border)};

    --bg-color-active: ${rgba(primary, -20)};
    --border-color-active: ${rgba(primary, 0)};

    --note-item-color: ${rgba(bg, 2)};
    --favorite-color: ${rgba(secondary)};

    --group-color: var(--bg-color-sidebar);
    --group-active-color: ${rgba(primary, -30)};
    --group-border-color: ${rgba(secondary, -30)};

    // }
  }
`;
