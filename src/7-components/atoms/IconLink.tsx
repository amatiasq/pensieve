import { css } from '@emotion/react';
import { AnchorHTMLAttributes } from 'react';

export interface IconLinkProps extends AnchorHTMLAttributes<any> {
  icon: JSX.Element;
}

export function IconLink(props: IconLinkProps) {
  const { icon, ...linkProps } = props;

  const styles = css`
    --size: 2rem;
    line-height: var(--size);
    height: var(--size);
    width: var(--size);
    border-radius: 100%;
    text-align: center;

    text-decoration: none;
    color: hsl(0, 0%, 70%);

    :hover {
      background: rgb(255 255 255 / 0.2);
    }

    svg {
      fill: var(--fg-color);
    }
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
