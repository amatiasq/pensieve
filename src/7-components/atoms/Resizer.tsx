import styled from '@emotion/styled';
import React, { HTMLAttributes, useCallback, useState } from 'react';

const Draggable = styled.div`
  height: 100vh;
  cursor: ew-resize;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

export interface ResizerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  size: number;
  onChange: (newSize: number) => void;
}

export function Resizer({ size, onChange, ...divProps }: ResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [initialPosition, setInitialPosition] = useState(size);
  const [delta, setDelta] = useState([0, 0]);

  const dragStart = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setInitialPosition(event.clientX);
    setDelta([0, 0]);
  }, []);

  const dragMove = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      isDragging && setDelta([delta[1], event.clientX - initialPosition]);
    },
    [isDragging, initialPosition, delta],
  );

  const dragEnd = useCallback(() => {
    const pos = initialPosition + delta[0];
    setIsDragging(false);
    setInitialPosition(pos);
    onChange(pos);
  }, [initialPosition, delta, onChange]);

  return (
    <Draggable
      {...divProps}
      draggable
      onDragStart={dragStart}
      onDrag={dragMove}
      onDragEnd={dragEnd}
    />
  );
}
