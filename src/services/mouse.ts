type Position = { x: number; y: number };

interface MouseMoveEvent {
  pos: Position;
  stop: () => void;
}

let pos: Position = { x: 0, y: 0 };

const update = (event: MouseEvent) =>
  (pos = { x: event.clientX, y: event.clientY });

document.addEventListener('mousedown', update);
document.addEventListener('mouseup', update);

onMouseMove(({ stop }) => stop());

export const getMousePosition = () => pos;

export function onMouseMove(listener: (event: MouseMoveEvent) => void) {
  document.addEventListener('mousemove', handler);
  const stop = () => document.addEventListener('mousemove', update);

  function handler(event: MouseEvent) {
    update(event);
    listener({ pos, stop });
  }
}
