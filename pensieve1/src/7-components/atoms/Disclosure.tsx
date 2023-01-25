import styled from '@emotion/styled';
import React, {
  Children,
  DetailsHTMLAttributes,
  PropsWithChildren,
  useCallback,
} from 'react';
import { CaretIcon } from '../icons/CaretIcon';
import { IconContainer } from '../icons/IconContainer';
import { hStack } from '../styles';

const AnimatedIcon = styled(IconContainer)`
  transform: rotate(0);
  transform-origin: 50% 50%;
  transition: var(--animation-speed) transform ease;
`;

const Details = styled.details`
  &[open] ${AnimatedIcon} {
    transform: rotate(90deg);
  }
`;

const Summary = styled.summary`
  ${hStack};
  --gap: var(--sidebar-gap);

  cursor: default;

  list-style: none;
  &::-webkit-details-marker,
  &::marker {
    display: none;
    content: '';
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
        <AnimatedIcon>
          <CaretIcon title="Open / close group" />
        </AnimatedIcon>
        {summary}
      </Summary>
      {content}
    </Details>
  );
}
