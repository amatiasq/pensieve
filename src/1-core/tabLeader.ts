import { emitter } from '@amatiasq/emitter';

const HEARTBEAT_MS = 5_000;
const TIMEOUT_MS = 10_000;

const tabId = crypto.randomUUID();
const channel = new BroadcastChannel('pensieve-leader');

let _isLeader = false;
let lastHeartbeat = 0;
let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

const emit = emitter<boolean>();
export const onLeaderChange = emit.subscribe;

export function isLeader() {
  return _isLeader;
}

function becomeLeader() {
  if (_isLeader) return;
  _isLeader = true;
  console.debug('👑 This tab is now the leader');
  emit(true);
  startHeartbeat();
}

function resignLeader() {
  if (!_isLeader) return;
  _isLeader = false;
  console.debug('👑 This tab resigned leadership');
  emit(false);
  clearInterval(heartbeatTimer);
}

function startHeartbeat() {
  clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    if (_isLeader) {
      channel.postMessage({ type: 'heartbeat', tabId });
    }
  }, HEARTBEAT_MS);
}

function checkLeader() {
  if (_isLeader) return;

  if (Date.now() - lastHeartbeat > TIMEOUT_MS) {
    // No leader heartbeat received — claim leadership
    channel.postMessage({ type: 'claim', tabId });
    becomeLeader();
  }
}

channel.onmessage = (event: MessageEvent) => {
  const { type, tabId: senderId } = event.data;

  if (senderId === tabId) return;

  if (type === 'heartbeat') {
    lastHeartbeat = Date.now();
    if (_isLeader) {
      // Another leader exists — resign if their ID is lower (deterministic)
      if (senderId < tabId) {
        resignLeader();
      }
    }
  }

  if (type === 'claim') {
    lastHeartbeat = Date.now();
    if (_isLeader && senderId < tabId) {
      resignLeader();
    }
  }

  if (type === 'resign') {
    // Leader resigned — check after a short delay to avoid race
    setTimeout(checkLeader, 1000);
  }
};

// Resign on page unload
window.addEventListener('beforeunload', () => {
  if (_isLeader) {
    channel.postMessage({ type: 'resign', tabId });
  }
});

// Claim leadership on startup — if no other tab contests within 500ms,
// this tab becomes leader. This ensures single-tab apps work immediately.
channel.postMessage({ type: 'claim', tabId });

let contested = false;

const originalOnMessage = channel.onmessage!;
channel.onmessage = (event: MessageEvent) => {
  const { type, tabId: senderId } = event.data;
  if (senderId !== tabId && (type === 'heartbeat' || type === 'claim')) {
    contested = true;
  }
  originalOnMessage.call(channel, event);
};

setTimeout(() => {
  if (!_isLeader && !contested) {
    becomeLeader();
  }
}, 500);

// Fallback: keep checking in case the leader disappears later
setInterval(checkLeader, TIMEOUT_MS);
