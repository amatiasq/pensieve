import { Gist } from './Gist';

export const getFiles = <T extends Gist>(self: T) =>
  Object.values(self.files) as T['files'][string][];
