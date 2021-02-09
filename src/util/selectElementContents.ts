export function selectElementContents(el: HTMLElement) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);

  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
