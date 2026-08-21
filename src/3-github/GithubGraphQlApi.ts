import { githubCircuitBreaker } from '../1-core/circuitBreaker.ts';
import { POST } from '../1-core/http.ts';
import { ghAuthHeaders, ghUrl } from './gh-utils.ts';
import { GithubToken } from './GithubAuth.ts';

export function githubGraphql<T = any>(
  token: GithubToken,
  query: string,
  variables: Record<string, string>,
) {
  const body = { query: buildQuery(query, variables), variables };
  const headers = ghAuthHeaders(token);

  return githubCircuitBreaker(() =>
    POST<T>(ghUrl('/graphql'), body, { headers }).then(x => {
      const { errors } = x as any;
      if (errors) console.error('GraphQL errors:', errors);
      return x;
    }),
  );
}

function buildQuery(query: string, params: Record<string, string>) {
  const keys = Object.keys(params);

  if (!keys.length) {
    return `query {${query}}`;
  }

  const args = keys.map(x => `$${x}: String!`).join(', ');
  return `query(${args}) {${query}}`;
}
