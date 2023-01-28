import { createSignal } from 'solid-js';
import styles from './App.module.css';
import { Editor } from './Editor';
import { Sidebar } from './Sidebar';
import { useActiveRepo } from './useActiveRepo';

export function App() {
  const repo = useActiveRepo();

  if (!repo) {
    return <Homepage />;
  }

  const [route, setRoute] = createSignal(location.hash.substring(1));

  window.addEventListener('hashchange', () =>
    setRoute(location.hash.substring(1))
  );

  console.log({ route: route() });

  return (
    <div class={styles.root}>
      <Sidebar repo={repo} />
      <Editor route={route()} />
    </div>
  );
}

function Homepage() {
  return (
    <div>
      No repository selected <a href="/amatiasq/amatiasq.com">Wanna try one?</a>
    </div>
  );
}
