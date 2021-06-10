import { Tag } from '../entities/Tag';
import { hookStore } from './helpers/hookStore';

export const useTags = hookStore<Tag[], []>([], () => (store, setValue) => {
  store.getTags().then(setValue);
  return store.onTagsChange(setValue);
});
