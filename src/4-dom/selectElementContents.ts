export function selectElementContents(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);

  const selection = clearSelection();

  if (selection) {
    selection.addRange(range);
  }
}

export function clearSelection() {
  const selection = window.getSelection();

  if (selection) {
    selection.removeAllRanges();
  }

  return selection;
}
