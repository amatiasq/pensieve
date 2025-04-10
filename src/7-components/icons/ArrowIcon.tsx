import { icon } from './icon.tsx';

const xPadding = 5;
const yPadding = 7;
const headEnd = 14;

const top = yPadding;
const left = headEnd;
const right = 24 - xPadding;
const bottom = 24 - yPadding;

const middle = 12;

export const ArrowIcon = icon(
  <svg viewBox="0 0 24 24" className="stroke">
    <path
      d={`
        M ${xPadding} ${middle}
        H ${right}
        L ${left} ${top}
        M ${right} ${middle}
        L ${left} ${bottom}
      `}
    />
  </svg>,
);
