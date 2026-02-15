import { jsx } from '@emotion/react';
import { Children, ClassAttributes, type ReactElement, type ReactNode } from 'react';

// const humanizePath = x => console.log(x.replace(/([a-z])/ig, '\n$1 ').trim())

export interface IconProps extends ClassAttributes<SVGAElement> {
  title: string;
}

export function icon(svg: ReactElement) {
  return function Icon({ title, ...props }: IconProps) {
    const { type } = svg;
    const { children, ...svgProps } = svg.props as Record<string, unknown>;

    return jsx(
      type,
      { ...svgProps, ...props },
      <title>{title}</title>,
      ...Children.toArray(children as ReactNode),
    );
  };
}
