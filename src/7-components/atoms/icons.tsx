import { css, jsx } from '@emotion/react';
import { Children } from 'react';

// const humanizePath = x => copy(x.replace(/([a-z])/ig, '\n$1 '))

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

  :hover {
    background: rgb(255 255 255 / 0.2);
  }

  svg {
    fill: var(--fg-color);
  }
`;

export interface IconProps {
  title: string;
  // This didn't work, don't know why
  // css?: SerializedStyles;
}

function icon(svg: JSX.Element) {
  return function Icon({ title }: IconProps) {
    const {
      type,
      props: { children, ...props },
    } = svg;

    return jsx(
      type,
      props,
      <title>{title}</title>,
      ...Children.toArray(children),
    );
  };
}

export const StarIcon = icon(
  <svg
    clipRule="evenodd"
    fillRule="evenodd"
    strokeLinejoin="round"
    strokeMiterlimit="2"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="nonzero"
      d="
        m 11.322 2.923
        c .126-.259.39-.423.678-.423.289 0 .552.164.678.423.974 1.998 2.65 5.44 2.65 5.44
        s 3.811.524 6.022.829
        c .403.055.65.396.65.747 0 .19-.072.383-.231.536-1.61 1.538-4.382 4.191-4.382 4.191
        s .677 3.767 1.069 5.952
        c .083.462-.275.882-.742.882-.122 0-.244-.029-.355-.089-1.968-1.048-5.359-2.851-5.359-2.851
        s -3.391 1.803-5.359 2.851
        c -.111.06-.234.089-.356.089-.465 0-.825-.421-.741-.882.393-2.185 1.07-5.952 1.07-5.952
        s -2.773-2.653-4.382-4.191
        c -.16-.153-.232-.346-.232-.535 0-.352.249-.694.651-.748 2.211-.305 6.021-.829 6.021-.829
        s 1.677-3.442 2.65-5.44
        z
      "
    />
  </svg>,
);

export const CaretIcon = icon(
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      fillRule="evenodd"
      d="
        M 8.646 5.646
        a .5.5 0 0 1 .708 0
        l 6 6
        a .5.5 0 0 1 0 .708
        l -6 6
        a .5.5 0 0 1-.708-.708
        L 14.293 12 8.646 6.354
        a .5.5 0 0 1 0-.708
        z
      "
    />
  </svg>,
);

export const TrashIcon = icon(
  <svg
    width="24"
    height="24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
  >
    <path
      d="
        M 19 24
        h -14
        c -1.104 0-2-.896-2-2
        v -16
        h 18
        v 16
        c 0 1.104-.896 2-2 2
        m -9-14
        c 0-.552-.448-1-1-1
        s -1 .448-1 1
        v 9
        c 0 .552.448 1 1 1
        s 1-.448 1-1
        v -9
        z
        m 6 0
        c 0-.552-.448-1-1-1
        s -1 .448-1 1
        v 9
        c 0 .552.448 1 1 1
        s 1-.448 1-1
        v -9
        z
        m 6-5
        h -20
        v -2
        h 6
        v -1.5
        c 0-.827.673-1.5 1.5-1.5
        h 5
        c .825 0 1.5.671 1.5 1.5
        v 1.5
        h 6
        v 2
        z
        m -12-2
        h 4
        v -1
        h -4
        v 1
        z "
    />
  </svg>,
);

export const GithubIcon = icon(
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
  >
    <path
      d="
        M 12 0
        c -6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577
        v -2.234
        c -3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222
        v 3.293
        c 0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12
        z
      "
    />
  </svg>,
);
