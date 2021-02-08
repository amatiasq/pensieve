import './Resizer.css';

import React, { useState } from 'react';

interface ResizerProps {
  size: number;
  onChange: (newSize: number) => void;
}

export function Resizer(props: ResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [initialPosition, setInitialPosition] = useState(props.size);
  const [delta, setDelta] = useState([0, 0]);

  const dragStart = (event: React.DragEvent<HTMLDivElement>) => {
    console.log('START');
    setIsDragging(true);
    setInitialPosition(event.clientX);
    setDelta([0, 0]);
  };

  const dragMove = (event: React.DragEvent<HTMLDivElement>) => {
    console.log(
      'MOVE',
      event.clientX - initialPosition,
      event.clientX,
      initialPosition,
    );
    isDragging && setDelta([delta[1], event.clientX - initialPosition]);
  };

  const dragEnd = (event: React.DragEvent<HTMLDivElement>) => {
    const pos = initialPosition + delta[0];
    console.log('END', pos, initialPosition, delta[0]);
    setIsDragging(false);
    setInitialPosition(pos);
    props.onChange(pos);
  };

  return (
    <div
      className="resizer"
      draggable={true}
      onDragStart={dragStart}
      onDrag={dragMove}
      onDragEnd={dragEnd}
    ></div>
  );
}
