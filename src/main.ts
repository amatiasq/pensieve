import { registerSW } from 'virtual:pwa-register';
import { onVirtualKeyboardDisplayChange } from './0-dom/virtualKeyboardDetector';
import { renderApp } from './5-app/renderApp';

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

registerSW({
  onNeedRefresh() {
    alert('New version downloaded. Please refresh the page');
  },
  onOfflineReady() {
    console.log('📡 Offline ready');
  },
});
