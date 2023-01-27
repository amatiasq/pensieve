import styles from './App.module.css';
import { Sidebar } from './Sidebar';
import { useActiveRepo } from './useActiveRepo';

export function App() {
  const repo = useActiveRepo();

  if (!repo) {
    return (
      <div>
        No repository selected{' '}
        <a href="/amatiasq/amatiasq.com">Wanna try one?</a>
      </div>
    );
  }

  return (
    <div class={styles.link}>
      <Sidebar repo={repo} />
    </div>
  );
}
