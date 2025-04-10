import { matchSorter } from 'match-sorter';

const WHITESPACE = /\s+/g;

export default class StringComparer {
  private readonly clean: string;

  constructor(public readonly needle: string) {
    this.clean = cleanString(needle);
  }

  fullMatch(target: string) {
    return cleanString(target) === this.clean;
  }

  matches(target: string) {
    if (!this.clean) {
      return true;
    }

    return cleanString(target).includes(this.clean);
  }

  matchesList<T>(list: T[], keys: (keyof T & string)[]) {
    return matchSorter(list, this.clean, {
      keys,
      threshold: matchSorter.rankings.ACRONYM,
    });
  }
}

function cleanString(value: string) {
  return value.toLowerCase().replace(WHITESPACE, '');
}
