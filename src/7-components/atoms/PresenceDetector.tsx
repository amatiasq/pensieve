import React, { useEffect, useRef } from 'react';
import { useIntersectionObserver } from 'usehooks-ts/dist/useIntersectionObserver';

interface PresenceDetectorProps {
  onVisible: () => unknown;
}

export function PresenceDetector(props: PresenceDetectorProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isVisible = Boolean(useIntersectionObserver(ref, {})?.isIntersecting);

  useEffect(() => {
    if (isVisible) {
      props.onVisible();
    }
  }, [isVisible]);

  return <div ref={ref}>&nbsp;</div>;
}
