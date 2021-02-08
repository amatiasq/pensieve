import { GistFileDetails } from '../contracts/GistFileDetails';
import { GistId } from '../contracts/type-aliases';
import { getGithubHeaders } from '../hooks/useGithubAuth';
import { PATCH } from './api';

export const GH_API = 'https://api.github.com';

export const updateGist = (
  id: GistId,
  body: {
    description?: string;
    files: Record<string, Partial<GistFileDetails>>;
  },
) => PATCH<any>(`${GH_API}/gists/${id}`, JSON.stringify(body), withAuth());

function withAuth() {
  const headers = getGithubHeaders();
  return { headers };
}
