import { registerSW } from 'virtual:pwa-register';
import { isMobile } from './0-dom/isMobile.ts';
import { onVirtualKeyboardDisplayChange } from './0-dom/virtualKeyboardDetector.ts';
import { renderApp } from './5-app/renderApp.tsx';

const container = document.getElementById('app-container');

if (!container) {
  throw new Error('Missing container element');
}

if (isMobile && !location.search.includes('debug')) {
  console.debug = () => {
    // Suppress verbose debug output on mobile unless ?debug is in URL
  };
}

renderApp(container);

navigator.storage?.persist?.().then(granted => {
  console.log('Persistent storage:', granted ? 'granted' : 'denied');
});

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
