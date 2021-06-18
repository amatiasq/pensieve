import { fromEvent } from 'rxjs';
import { distinctUntilChanged, map, mergeWith } from 'rxjs/operators';

const { isHidden, visibilitychange: vc } = getPageVisibilityKeys();

export const onPageShow = fromEvent(window, 'pageshow');
export const onPageHide = fromEvent(window, 'pagehide');

export const onPageFreeze = fromEvent(window, 'freeze');
export const onPageResume = fromEvent(window, 'resume');

export const beforePageUnloads = fromEvent(window, 'beforeunload');
export const onPageVisibilityChange = fromEvent(document, vc).pipe(
  map(() => !document[isHidden]),
);

export const onPageActive = onPageVisibilityChange.pipe(
  mergeWith(
    onPageShow.pipe(map(() => true)),
    onPageHide.pipe(map(() => false)),
    onPageFreeze.pipe(map(() => true)),
    onPageResume.pipe(map(() => false)),
    beforePageUnloads.pipe(map(() => false)),
  ),
  distinctUntilChanged(),
);

function getPageVisibilityKeys(): {
  readonly isHidden: 'hidden';
  readonly visibilitychange: 'visibilitychange';
} {
  if (document.addEventListener == null) {
    throwUnsupportedBrowserError('Page Visibility API');
  }

  if (document.hidden != null) {
    // Opera 12.10 and Firefox 18 and later support
    return {
      isHidden: 'hidden',
      visibilitychange: 'visibilitychange',
    } as const;
  }

  if ((document as any).msHidden != null) {
    return {
      isHidden: 'msHidden' as 'hidden',
      visibilitychange: 'msvisibilitychange' as 'visibilitychange',
    } as const;
  }

  if ((document as any).webkitHidden != null) {
    return {
      isHidden: 'webkitHidden' as 'hidden',
      visibilitychange: 'webkitvisibilitychange' as 'visibilitychange',
    } as const;
  }

  throwUnsupportedBrowserError('Page Visibility API');
}

function throwUnsupportedBrowserError(feature: string): never {
  class UnsupportedBrowser extends Error {
    constructor(feature: string) {
      super(
        `This feature requires a browser, such as Google Chrome or Firefox, that supports ${feature}.`,
      );
    }
  }

  throw new UnsupportedBrowser(feature);
}
