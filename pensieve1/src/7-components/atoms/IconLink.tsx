import styled from '@emotion/styled';
import { AnchorHTMLAttributes } from 'react';
import { iconContainerStyles } from '../icons/IconContainer';

const Link = styled.a`
  ${iconContainerStyles};
  text-decoration: none;
  color: hsl(0, 0%, 70%);

  :hover {
    background: rgb(255 255 255 / 0.2);
  }
`;

export interface IconLinkProps extends AnchorHTMLAttributes<any> {
  icon: JSX.Element;
}

export function IconLink(props: IconLinkProps) {
  const { icon, ...linkProps } = props;

  return (
    <Link
      target="_blank"
      {...linkProps}
      onClick={event => event.stopPropagation()}
    >
      {icon}
    </Link>
  );
}
