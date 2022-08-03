import { icon } from './icon';

const padding = 4;
const opposite = 24 - padding;

export const CrossIcon = icon(
  <svg viewBox="0 0 24 24" className="stroke">
    <line x1={padding} y1={padding} x2={opposite} y2={opposite} />
    <line x1={padding} y1={opposite} x2={opposite} y2={padding} />
  </svg>,
);
