import React, { useState } from 'react';
import './Resizer.css';

interface ResizerProps {
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
    <div
      className="resizer"
      draggable={true}
      onDragStart={dragStart}
      onDrag={dragMove}
      onDragEnd={dragEnd}
    ></div>
  );
}
