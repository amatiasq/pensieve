import { For } from 'solid-js';
import { createStore } from 'solid-js/store';
import styles from './App.module.css';
import { Repository } from './tools/Repository';

function useRepoFiles(user: string, name: string) {
  const [files, setFiles] = createStore<string[]>([]);
  const repo = new Repository(user, name);

  function setCleanFiles(value: string[]) {
    const clean = value.map((x) => x.replace(`${repo.path}/`, ''));
    return setFiles(clean);
  }

  repo.getFiles().then(setCleanFiles);

  repo
    .clone()
    .then(() => repo.getFiles())
    .then(setCleanFiles);

  return files;
}

export function App() {
  const url = new URL(location.href);
  const [user, repo, ...params] = url.pathname.split('/').filter(Boolean);

  if (!user || !repo) return 'MEH';

  const files = useRepoFiles(user, repo);

  return (
    <div class={styles.link}>
      <For each={files}>{(file) => <li>{file}</li>}</For>
    </div>
  );
}
