import { renderApp } from './components/App';
import { onVirtualKeyboardDisplayChange } from './dom/virtualKeyboardDetector';

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

onVirtualKeyboardDisplayChange(isVisible => {
  if (isVisible) {
    container.classList.add('is-virtual-keyboard-open');
  } else {
    container.classList.remove('is-virtual-keyboard-open');
  }
});
