import React from 'react';
import './Loader.scss';

export function Loader() {
  return (
    <div className="loader">
      <div className="container">
        <div className="ripple"></div>
        <div className="ripple ripple2"></div>
      </div>
    </div>
  );
}
