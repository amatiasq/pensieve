import { Gist } from './Gist';

export const getFiles = <T extends Gist>(self: T) =>
  Object.values(self.files) as T['files'][string][];

export const getGistDate = <T extends Gist>(self: T) =>
  self.created_at.split('T')[0];
