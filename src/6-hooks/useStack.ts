import { useEffect, useState } from 'react';

export function useStack<T>(length: number, initialEntry?: T) {
  const [stack] = useState<T[]>([]);

  useEffect(() => {
    if (initialEntry !== undefined) {
      stack.push(initialEntry);
    }
  }, []);

  return [stack, push] as const;

  function push(value: T) {
    stack.push(value);

    if (stack.length > length) {
      stack.length = length;
    }
  }
}
