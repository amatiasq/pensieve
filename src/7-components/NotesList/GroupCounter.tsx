import styled from '@emotion/styled';

const Counter = styled.i`
  font-size: 0.8rem;
`;

const FavCounter = styled.i`
  color: var(--favorite-color);
  font-size: 0.8rem;
`;

export interface GroupCounterProps {
  favorites: number;
  items: number;
}

export function GroupCounter({ favorites, items }: GroupCounterProps) {
  const itemsCounter = <Counter>{items}</Counter>;

  if (!favorites) {
    return itemsCounter;
  }

  return (
    <>
      <FavCounter>{favorites}</FavCounter> / {itemsCounter}
    </>
  );
}
