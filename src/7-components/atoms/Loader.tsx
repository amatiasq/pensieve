import React from 'react';
import './Loader.scss';

interface LoaderProps {
  onClick?: () => unknown;
}

export function Loader({ onClick }: LoaderProps) {
  return (
    <div className="loader" onClick={onClick}>
      <div className="container">
        <div className="ripple"></div>
        <div className="ripple ripple2"></div>
      </div>
    </div>
  );
}
