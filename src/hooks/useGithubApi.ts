import { useEffect, useState } from 'react';
import { GET } from '../services/api';
import { GH_API } from '../services/github_api';
import { getGithubHeaders } from './useGithubAuth';

export function useGithubApi<T>(url: string) {
  const [cache, setCache] = useState<T | null>(null);
  const headers = getGithubHeaders();

  useEffect(() => {
    GET<T>(`${GH_API}${url}`, { headers }).then(setCache);
  }, [url]);

  return cache;
}
