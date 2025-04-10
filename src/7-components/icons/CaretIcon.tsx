import { icon } from './icon.tsx';

const padding = { x: 10, y: 7 };

const top = padding.y;
const left = padding.x;
const right = 24 - padding.x;
const bottom = 24 - padding.y;

export const CaretIcon = icon(
  <svg viewBox="0 0 24 24" className="stroke">
    <line x1={left} y1={top} x2={right} y2="12" />
    <line x1={left} y1={bottom} x2={right} y2="12" />
  </svg>,
);
