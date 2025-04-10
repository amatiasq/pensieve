import { POST } from '../1-core/http.ts';
import { ghCommitEndpoint } from './gh-utils.ts';
import { GithubToken } from './GithubAuth.ts';
import { GithubGraphQlApi } from './GithubGraphQlApi.ts';
import { GithubRestApi, MediaType } from './GithubRestApi.ts';
import {
  GHApiRepositoryNode,
  GHNodeSha,
  GHRepoNodeType,
} from './models/GHApiRepositoryNode.ts';

const CREATE_REPO_CONFIG = {
  has_issues: false,
  has_projects: false,
  has_wiki: false,
  auto_init: true,
  allow_merge_commit: true,
  allow_squash_merge: false,
  allow_rebase_merge: false,
  delete_branch_on_merge: false,
  has_downloads: false,
  is_template: false,
};

// any is necessary here because of https://github.com/microsoft/TypeScript/issues/14174#issuecomment-856812565
export type StagedFiles = Record<string, any>;

export interface GHRepoNode {
  type: GHRepoNodeType;
  sha: GHNodeSha;
  name: string;
  path: string;
  size: number;
}

export interface GHRepoFile extends GHRepoNode {
  type: 'file';
  content: string;
}

export class GHRepository {
  private readonly rest: GithubRestApi;
  private readonly gql: GithubGraphQlApi;
  private commiting = false;
  branch = 'main';

  get url() {
    return `/repos/${this.owner}/${this.name}`;
  }

  get isCommiting() {
    return this.commiting;
  }

  constructor(
    readonly token: GithubToken,
    readonly owner: string,
    readonly name: string,
  ) {
    this.rest = new GithubRestApi(token);
    this.gql = new GithubGraphQlApi(token);
  }

  exists() {
    return this.rest.GET(this.url).then(
      () => true,
      () => false,
    );
  }

  async create(description: string, isPrivate: boolean) {
    try {
      await this.rest.POST('/user/repos', {
        name: this.name,
        description,
        homepage: '',
        private: isPrivate,
        visibility: isPrivate ? 'private' : 'public',
        ...CREATE_REPO_CONFIG,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createIfNecessary(description: string, isPrivate: boolean) {
    if (await this.exists()) {
      return false;
    }

    await this.create(description, isPrivate);
    return true;
  }

  async readDir(path: string) {
    const clean = path.replace(/^\*|\*$/g, '');
    const response = await this.gql.send<FilesContentResponse>(
      getFilesContent(),
      this.getFileVars(clean),
    );

    const { entries } = response.data.repository.files ?? {};
    return entries?.map(x => [x.path, x.object.text] as const) ?? [];
  }

  getReadme() {
    return this.rest.GET<string>(`${this.url}/readme`, {
      mediaType: MediaType.Raw,
    });
  }

  async readFile(path: string): Promise<string> {
    const file = await this.rest.GET<string | GHApiRepositoryNode[]>(
      `${this.url}/contents/${path}`,
      { mediaType: MediaType.Raw },
    );

    if (Array.isArray(file)) {
      throw new Error(`${this.url}/${path} is a directory`);
    }

    return file;
  }

  async writeFile(path: string, content: string, message: string) {
    await this.rest.PUT(`${this.url}/contents/${path}`, { message, content });
  }

  async commit(message: string, files: StagedFiles, isUrgent = false) {
    const { owner: username, name, branch, token } = this;
    const body = {
      token,
      owner: username,
      repo: name,
      branch,
      files,
      message,
    };

    this.commiting = true;

    try {
      return await POST<void>(ghCommitEndpoint, body, { keepalive: isUrgent });
    } finally {
      this.commiting = false;
    }
  }

  async readFileCool(path: string, keys: string) {
    const response = await this.gql.send(
      getFileProperty(keys),
      this.getFileVars(path),
    );

    return response.data.repository.file?.text as string;
  }

  private getFileVars(path: string) {
    return {
      owner: this.owner,
      repo: this.name,
      path: `${this.branch}:${path}`,
    };
  }
}

const requestLimit = localStorage.getItem('gh-req-limit') || 5000;

function getFileProperty(keys: string) {
  return `
    repository(owner: $owner, name: $repo) {
      object(expression: $path, limit: ${requestLimit}) {
        ... on Blob {
          ${keys}
        }
      }
    }
  `;
}

type FilesContentResponse = {
  data: {
    repository: {
      files: {
        entries: {
          path: string;
          object: { text: string };
        }[];
      };
    };
  };
};

function getFilesContent() {
  return `
    repository(owner: $owner, name: $repo) {
      files: object(expression: $path) {
        ... on Tree {
          entries {
            path
            object {
              ... on Blob {
                text
              }
            }
          }
        }
      }
    }
  `;
}
