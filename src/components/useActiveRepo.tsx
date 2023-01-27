import { Repository } from '../tools/Repository';

export function useActiveRepo() {
  const url = new URL(location.href);
  const [user, repo, ...params] = url.pathname.split('/').filter(Boolean);
  return user && repo ? new Repository(user, repo) : null;
}
