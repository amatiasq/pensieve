import { useScheduler } from './useScheduler';

type Event = React.MouseEvent<HTMLDivElement, MouseEvent>;

export function useLongPress(handler?: () => void, duration = 500) {
  let isLongPress = false;

  const longPressWaiter = useScheduler(duration, () => {
    isLongPress = true;

    if (handler) {
      handler();
    }
  });

  return {
    onMouseUp,
    onMouseLeave,
    onMouseDown,
    onClick,
  };

  function onMouseDown() {
    isLongPress = false;
    longPressWaiter.start();
  }

  function onMouseUp() {
    return longPressWaiter.stop();
  }

  function onMouseLeave(event: Event) {
    if (isLongPress) {
      event.preventDefault();
      isLongPress = false;
    }
  }

  function onClick(event: Event) {
    if (isLongPress) {
      event.preventDefault();
      isLongPress = false;
    }
  }
}
