import styled from '@emotion/styled';
import { forwardRef, useCallback } from 'react';
import { NoteId } from '../../2-entities/Note';
import { useNote } from '../../6-hooks/useNote';
import { IconButton, IconButtonProps } from '../atoms/IconButton';
import { StarIcon } from '../atoms/icons';

type ClickEvent = React.MouseEvent<HTMLButtonElement, MouseEvent>;

const FavouriteButtonContainer = styled(IconButton)`
  svg {
    fill: var(--favorite-color);
    stroke: var(--favorite-color);
    stroke-width: 1px;
  }

  &.off {
    svg {
      fill: transparent;
      stroke-width: 2px;
    }
  }
`;

export interface FavoriteButtonProps
  extends Omit<IconButtonProps, 'icon' | 'onClick'> {
  id: NoteId;
}

export const FavoriteButton = forwardRef(function FavoriteButton(
  { id, className = '', ...props }: FavoriteButtonProps,
  ref: any,
) {
  const [note, { toggleFavorite }] = useNote(id);

  const handleClick = useCallback(
    (event: ClickEvent) => {
      event.preventDefault();
      toggleFavorite();
    },
    [toggleFavorite],
  );

  if (!note) return null;

  const icon = note.favorite ? (
    <StarIcon title="Remove from favorites" />
  ) : (
    <StarIcon title="Add to favorites" />
  );

  return (
    <FavouriteButtonContainer
      {...props}
      ref={ref}
      icon={icon}
      className={`${className} ${note.favorite ? 'on' : 'off'}`}
      onClick={handleClick}
    />
  );
});
