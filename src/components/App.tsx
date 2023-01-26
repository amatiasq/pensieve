import { DependencyList, useEffect, useState } from 'react';
import { useGitRepo } from '../hooks/useGitRepo';
import './App.css';

function useActiveRepo() {
  const url = new URL(location.href);
  const [user, repoName, ...params] = url.pathname.split('/').filter(Boolean);
  const repo = useGitRepo(user, repoName);
  return repo;
}

function useAsync<T>(
  callback: () => Promise<T>,
  deps: DependencyList = []
): T | undefined {
  const [value, setValue] = useState<T>();

  useEffect(() => {
    callback().then(setValue);
  }, deps);

  return value;
}

export function App() {
  const repo = useActiveRepo();
  const files = useAsync(() => repo.getFiles(), []) ?? [];

  return (
    <ul>
      {files.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}
