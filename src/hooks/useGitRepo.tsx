import { mkdirRecursive } from '../fs';
import { clone } from '../git';

const repositories = new Map<ReturnType<typeof key>, Repository>();
const key = (user: string, name: string) => `/${user}/${name}` as const;

class Repository {
  get path() {
    return key(this.user, this.name);
  }

  constructor(public readonly user: string, public readonly name: string) {}

  clone() {
    mkdirRecursive(this.path);

    return clone({
      dir: this.path,
      url: `https://github.com${this.path}`,
      singleBranch: true,
      depth: 1,
      onAuth: (url) => getCredentials(this.user) ?? { cancel: true },
    });
  }
}

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

function getCredentials(user: string) {
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
