import { Emitter, emitter } from '@amatiasq/emitter';

const emitters: Record<string, Emitter<any>> = {};
const id = crypto.randomUUID();

// Cross-tab sync via BroadcastChannel
const channel = new BroadcastChannel('pensieve');

channel.onmessage = (event: MessageEvent) => {
  const { type, data, senderId } = event.data;
  if (senderId === id) return;

  const emitter = emitters[type];
  if (typeof emitter === 'function') {
    console.debug(`🚎⬇ ${type} (from another tab)`, data);
    emitter(data);
  }
};

// Same-tab dispatch via postMessage
window.addEventListener('message', (event: MessageEvent<any>) => {
  const emitter = emitters[event.data.type];

  if (typeof emitter === 'function') {
    console.debug(`🚎 ${event.data.type}`, event.data.data);
    emitter(event.data.data);
  }
});

export function messageBus<Data = undefined>(key: string) {
  const emit = emitter<Data>();
  emitters[key] = emit;

  const notify = (data: Data) => {
    // Notify same tab
    setTimeout(() => postMessage({ id, type: key, data }, location.origin), 10);
    // Notify other tabs
    channel.postMessage({ senderId: id, type: key, data });
  };

  return [notify, emit.subscribe] as const;
}
