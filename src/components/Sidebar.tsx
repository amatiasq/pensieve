import { createMemo } from 'solid-js';
import { Repository } from '../tools/Repository';
import { createTree, PrintTree } from './PrintTree';
import styles from './Sidebar.module.scss';
import { useRepoFiles } from './useRepoFiles';

export function Sidebar(props: { repo: Repository }) {
  const files = useRepoFiles(props.repo);
  const tree = createMemo(() => createTree(files, `${props.repo.path}/#`));

  return (
    <aside class={styles.sidebar}>
      <PrintTree class={styles.tree} root={tree()} />
    </aside>
  );
}
