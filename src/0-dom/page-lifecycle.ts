type Listener = (active: boolean) => void;

const listeners = new Set<Listener>();
let lastValue: boolean | null = null;

function emit(active: boolean) {
  if (active === lastValue) return;
  lastValue = active;
  listeners.forEach(fn => fn(active));
}

document.addEventListener('visibilitychange', () =>
  emit(!document.hidden),
);
window.addEventListener('pageshow', () => emit(true));
window.addEventListener('pagehide', () => emit(false));
window.addEventListener('freeze', () => emit(false));
window.addEventListener('resume', () => emit(true));
window.addEventListener('beforeunload', () => emit(false));

export const onPageActive = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return { unsubscribe: () => listeners.delete(listener) };
  },
};
