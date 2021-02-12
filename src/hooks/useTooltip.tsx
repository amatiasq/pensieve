import './useTooltip.scss';

import React, { useState } from 'react';

import { useScheduler } from './useScheduler';

export function useTooltip(
  text: string,
  {
    duration = 5000,
    position,
  }: {
    duration?: number;
    position?: 'top' | 'left' | 'right' | 'bottom';
  } = {},
) {
  const [isVisible, setIsVisible] = useState(false);
  const timer = useScheduler(duration, () => setIsVisible(false));

  const el = (
    <div
      className={`${position} ${isVisible ? 'visible' : ''}`}
      data-tooltip={text}
    ></div>
  );

  return [el, show] as [JSX.Element, () => void];

  function show() {
    timer.start();
    setIsVisible(true);
  }
}
