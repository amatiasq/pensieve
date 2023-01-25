import { emitter } from '@amatiasq/emitter';
import { isMobile } from './isMobile';

type Size = { w: number; h: number };
const isSameSize = (a: Size, b: Size) => a.w === b.w && a.h === b.h;
const isHeightBigger = (a: Size, b: Size) => a.w === b.w && a.h > b.h;

const initial: Size = { w: window.innerWidth, h: window.innerHeight };
let prev: Size = { w: window.innerWidth, h: window.innerHeight };
let current: Size = { w: window.innerWidth, h: window.innerHeight };
let isKeyboardShown = false;

const emit = emitter<boolean>();

export const onVirtualKeyboardDisplayChange = emit.subscribe;

if (isMobile) {
  window.addEventListener('resize', () => {
    prev = current;
    current = { w: window.innerWidth, h: window.innerHeight };

    if (isSameSize(current, initial) && isHeightBigger(current, prev)) {
      setStatus(false);
      return;
    }

    if (isSameSize(prev, initial) && isHeightBigger(prev, current)) {
      setStatus(false);
      return;
    }
  });
}

function setStatus(value: boolean) {
  if (isKeyboardShown !== value) {
    isKeyboardShown = value;
    emit(value);
  }
}
