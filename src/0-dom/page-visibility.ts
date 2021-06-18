import { emitter } from '@amatiasq/emitter';

const { isHidden, eventName } = getKeyNames();
const emitVisibilityChange = emitter<boolean>();

type VisibilityChangeListener = Parameters<
  typeof emitVisibilityChange.subscribe
>[0];

document.addEventListener(
  eventName,
  () => emitVisibilityChange(!document[isHidden]),
  false,
);

export function onPageVisibilityChange(listener: VisibilityChangeListener) {
  return emitVisibilityChange.subscribe(listener) as () => void;
}

function getKeyNames() {
  if (document.addEventListener == null) {
    throw unsupportedBrowser();
  }

  if (document.hidden != null) {
    // Opera 12.10 and Firefox 18 and later support
    return {
      isHidden: 'hidden',
      eventName: 'visibilitychange',
    } as const;
  }

  if ((document as any).msHidden != null) {
    return {
      isHidden: 'msHidden' as 'hidden',
      eventName: 'msvisibilitychange' as 'visibilitychange',
    } as const;
  }

  if ((document as any).webkitHidden != null) {
    return {
      isHidden: 'webkitHidden' as 'hidden',
      eventName: 'webkitvisibilitychange' as 'visibilitychange',
    } as const;
  }

  throw unsupportedBrowser();
}

function unsupportedBrowser() {
  throw new Error(
    'This demo requires a browser, such as Google Chrome or Firefox, that supports the Page Visibility API.',
  );
}
