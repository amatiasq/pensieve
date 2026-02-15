import { githubCircuitBreaker } from '../1-core/circuitBreaker.ts';
import { POST } from '../1-core/http.ts';
import { ghAuthHeaders, ghUrl } from './gh-utils.ts';
import { GithubToken } from './GithubAuth.ts';

export class GithubGraphQlApi {
  constructor(public token: GithubToken) {}

  send<T = any>(query: string, variables: Record<string, string>) {
    const fullQuery = this.buildQuery(query, variables);
    const body = { query: fullQuery, variables };
    const headers = ghAuthHeaders(this.token);

    return githubCircuitBreaker.execute(() =>
      POST<T>(ghUrl('/graphql'), body, { headers }).then(x => {
        const { errors } = x as any;
        if (errors) console.error('GraphQL errors:', errors);
        return x;
      }),
    );
  }

  private buildQuery(query: string, params: Record<string, string>) {
    const keys = Object.keys(params);

    if (!keys.length) {
      return `query {${query}}`;
    }

    const args = keys.map(x => `$${x}: String!`).join(', ');
    return `query(${args}) {${query}}`;
  }
}
