const WHITESPACE = /\s+/g;

export default class StringComparer {
  private clean: string;

  constructor(needle: string) {
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
}

function cleanString(value: string) {
  return value.toLowerCase().replace(WHITESPACE, '');
}
