import { PropsWithChildren, useEffect } from 'react';
import { useIntersectionObserver } from 'usehooks-ts';

interface PresenceDetectorProps {
  className?: string;
  onVisible: () => unknown;
}

export function PresenceDetector({
  className,
  onVisible,
  children,
}: PropsWithChildren<PresenceDetectorProps>) {
  const [ref, isVisible] = useIntersectionObserver();

  useEffect(() => {
    if (isVisible) {
      onVisible();
    }
  }, [isVisible]);

  return (
    <div ref={ref} className={className}>
      {children || ' '}
    </div>
  );
}
