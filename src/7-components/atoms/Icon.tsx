import React from 'react';

export function Icon({
  name,
  prefix = 'fas',
  className,
}: {
  name: string;
  prefix?: 'fab' | 'fac' | 'fas';
  className?: string;
}) {
  const [fas, icon] = name.includes(' ') ? name.split(' ') : [prefix, name];
  return <i className={`${fas} fa-${icon} ${className || ''}`}></i>;
}
