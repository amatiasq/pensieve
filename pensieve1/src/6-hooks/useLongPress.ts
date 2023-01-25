import { useState } from 'react';
import { useScheduler } from './useScheduler';

type Event = React.MouseEvent<HTMLDivElement, MouseEvent>;

export function useLongPress(handler?: () => void, duration = 500) {
  const [isLongPress, setIsLongPress] = useState(false);

  const longPressWaiter = useScheduler(duration, () => {
    setIsLongPress(true);

    if (handler) {
      handler();
    }
  });

  return {
    onMouseUp,
    onMouseLeave,
    onMouseDown,
    onClickCapture,
  };

  function onMouseDown() {
    setIsLongPress(false);
    longPressWaiter.start();
  }

  function onMouseUp() {
    return longPressWaiter.stop();
  }

  function onMouseLeave(event: Event) {
    if (isLongPress) {
      event.nativeEvent.stopImmediatePropagation();
      event.preventDefault();
    }
  }

  function onClickCapture(event: Event) {
    if (isLongPress) {
      event.nativeEvent.stopImmediatePropagation();
      event.preventDefault();
      setIsLongPress(false);
    }
  }
}
