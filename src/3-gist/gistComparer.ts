import { Gist } from './Gist';

export function gistComparer(a: Gist, b: Gist) {
  return a.id === b.id;
}
