import localforage from 'localforage';

import { onVirtualKeyboardDisplayChange } from './4-dom/virtualKeyboardDetector';
import { renderApp } from './5-app/App';
import { initShorcuts } from './5-app/shortcuts';

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js');
  }
});

const container = document.getElementById('app-container');

if (!container) {
  throw new Error('Missing container element');
}

renderApp(container);
initShorcuts();

onVirtualKeyboardDisplayChange(isVisible => {
  if (isVisible) {
    container.classList.add('is-virtual-keyboard-open');
  } else {
    container.classList.remove('is-virtual-keyboard-open');
  }
});

Object.assign(window, { localforage });
