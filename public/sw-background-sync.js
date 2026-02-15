// Injected into generated SW via importScripts.
// Handles Background Sync API events to flush the offline outbox
// when connectivity returns — even if no tab is open.

self.addEventListener('sync', (event) => {
  if (event.tag === 'outbox-flush') {
    event.waitUntil(notifyClientsToFlush());
  }
});

async function notifyClientsToFlush() {
  const clients = await self.clients.matchAll({ type: 'window' });

  if (clients.length === 0) {
    // No open tabs — sync will retry automatically next time a tab opens
    // (auth token is in localStorage which SW can't access)
    return;
  }

  for (const client of clients) {
    client.postMessage({ type: 'flush-outbox' });
  }
}
