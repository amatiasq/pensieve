import styled from '@emotion/styled';
import React, {
  Children,
  DetailsHTMLAttributes,
  PropsWithChildren,
  useCallback,
} from 'react';
import { CaretIcon } from '../icons/CaretIcon';
import { IconContainer } from '../icons/IconContainer';

const Details = styled.details`
  summary svg:first-of-type {
    transform: rotate(0);
    transform-origin: 50% 50%;
    transition: var(--animation-speed) transform ease;
  }

  &[open] summary svg:first-of-type {
    transform: rotate(90deg);
  }
`;

const Summary = styled.summary`
  display: flex;
  align-items: center;
  gap: var(--sidebar-gap);
  padding: var(--sidebar-gap);
  padding-right: calc(var(--sidebar-gap) * 2);
  cursor: default;
  border-left: var(--group-border-width) solid transparent;
  border-top: var(--group-border-width) solid transparent;

  list-style: none;
  &::-webkit-details-marker,
  &::marker {
    display: none;
    content: '';
  }

  svg:first-of-type {
    width: 2em;
    fill: var(--fg-color);
  }
`;

export interface DisclosureToggleEvent {
  target: HTMLDetailsElement;
  isOpen: boolean;
}

export interface DisclosureProps
  extends Omit<DetailsHTMLAttributes<any>, 'open' | 'onToggle'> {
  isOpen: boolean;
  onToggle: (event: DisclosureToggleEvent) => void;
}

export function Disclosure({
  isOpen,
  onToggle,
  children,
  ...props
}: PropsWithChildren<DisclosureProps>) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      const target = (event.currentTarget as HTMLElement)
        .parentElement as HTMLDetailsElement;

      const isOpen = target.hasAttribute('open');

      onToggle({ target, isOpen });
    },
    [onToggle],
  );

  const [summary, ...content] = Children.toArray(children);

  return (
    <Details {...props} open={isOpen}>
      <Summary onClick={handleClick}>
        <IconContainer>
          <CaretIcon title="Open / close group" />
        </IconContainer>
        {summary}
      </Summary>
      {content}
    </Details>
  );
}
