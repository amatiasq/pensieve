import styled from '@emotion/styled';
import React, { useState } from 'react';

const Main = styled.div`
  width: 5px;
  cursor: ew-resize;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

export interface ResizerProps {
  size: number;
  onChange: (newSize: number) => void;
}

export function Resizer(props: ResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [initialPosition, setInitialPosition] = useState(props.size);
  const [delta, setDelta] = useState([0, 0]);

  const dragStart = (event: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setInitialPosition(event.clientX);
    setDelta([0, 0]);
  };

  const dragMove = (event: React.DragEvent<HTMLDivElement>) => {
    isDragging && setDelta([delta[1], event.clientX - initialPosition]);
  };

  const dragEnd = () => {
    const pos = initialPosition + delta[0];
    setIsDragging(false);
    setInitialPosition(pos);
    props.onChange(pos);
  };

  return (
    <Main
      className="resizer"
      draggable={true}
      onDragStart={dragStart}
      onDrag={dragMove}
      onDragEnd={dragEnd}
    />
  );
}
