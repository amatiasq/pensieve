import { Repository } from '../tools/Repository';

const repositories = new Map<ReturnType<typeof key>, Repository>();
export const key = (user: string, name: string) => `/${user}/${name}` as const;

export function useGitRepo(user: string, name: string) {
  const id = key(user, name);

  if (repositories.has(id)) {
    return repositories.get(id);
  }

  const repo = new Repository(user, name);

  repo.clone();

  repositories.set(id, repo);
  return repo;
}

export function getCredentials(user: string) {
  const key = 'pensieve.auth';
  const stored = localStorage.getItem(key);

  if (stored) return JSON.parse(stored);

  const username = prompt('Enter username or Github Access Token', user);
  const auth = {
    username,
    password: username?.startsWith('ghp_') ? '' : prompt('Enter password'),
  };

  localStorage.setItem(key, JSON.stringify(auth));
  return auth;
}
