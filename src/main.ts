// import { GithubRepository } from './gh/GithubRepository';

// const repo = new GithubRepository(
//   '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',
//   'amatiasq',
//   'takenote-data',
// );

// repo.readJsonFile('notes.json').then(x => console.log(x));

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
