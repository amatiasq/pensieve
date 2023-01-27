import { createStore } from 'solid-js/store';
import { GitRepository } from '../tools/GitRepository';
import { Repository } from '../tools/Repository';

export function useRepoFiles(repo: Repository) {
  const [files, setFiles] = createStore<string[]>([]);

  function setCleanFiles(value: string[]) {
    const clean = value.map((x) => x.replace(`${repo.path}/`, ''));
    return setFiles(clean);
  }

  repo.getFiles().then(setCleanFiles);

  new GitRepository(repo)
    .clone()
    .then(() => repo.getFiles())
    .then(setCleanFiles);

  return files;
}
