import { css } from '@emotion/react';
import { AnchorHTMLAttributes } from 'react';
import { iconContainerStyles } from './icons';

export interface IconLinkProps extends AnchorHTMLAttributes<any> {
  icon: JSX.Element;
}

export function IconLink(props: IconLinkProps) {
  const { icon, ...linkProps } = props;

  const styles = css`
    ${iconContainerStyles}
    text-decoration: none;
    color: hsl(0, 0%, 70%);
  `;

  return (
    <a
      target="_blank"
      {...linkProps}
      onClick={event => event.stopPropagation()}
      css={styles}
    >
      {icon}
    </a>
  );
}
