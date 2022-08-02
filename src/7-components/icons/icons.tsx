import { jsx } from '@emotion/react';
import { Children, ClassAttributes } from 'react';

// const humanizePath = x => console.log(x.replace(/([a-z])/ig, '\n$1 ').trim())

export interface IconProps extends ClassAttributes<SVGAElement> {
  title: string;
}

export function icon(svg: JSX.Element) {
  return function Icon({ title, ...props }: IconProps) {
    const {
      type,
      props: { children, ...svgProps },
    } = svg;

    return jsx(
      type,
      { ...svgProps, ...props },
      <title>{title}</title>,
      ...Children.toArray(children),
    );
  };
}
