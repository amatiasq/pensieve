import './tooltip.scss';

import { escapeHtml } from '../util/escapeHtml';
import { getMousePosition } from '../util/Mouse';

export function tooltip(
  text: string,
  position: 'top' | 'left' | 'right' | 'bottom' = 'bottom',
) {
  const el = render(`
    <div role="tooltip" class="tooltip ${position}">
      ${escapeHtml(text)}
    </div>
  `);

  const mouse = getMousePosition();
  el.style.top = `${mouse.y}px`;
  el.style.left = `${mouse.x}px`;

  show();
  el.addEventListener('animationend', hide);

  return show;

  function show() {
    document.body.appendChild(el);
    document.addEventListener('mousemove', onMouseMove);
  }

  function hide() {
    document.body.removeChild(el);
    document.removeEventListener('mousemove', onMouseMove);
  }

  function onMouseMove(event: MouseEvent) {
    el.style.top = `${event.clientY}px`;
    el.style.left = `${event.clientX}px`;
  }
}

function render(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstElementChild as HTMLElement;
}
