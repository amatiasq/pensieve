import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { onBusinessChange } from '../../1-core/busy-indicator';
import { LoadingIcon } from './icons';

const Container = styled.div`
  position: fixed;
  bottom: 8px;
  right: 24px;
  width: 32px;
  height: 32px;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 1.3rem;
`;

const Icon = styled(LoadingIcon)`
  fill: #6060f891;

  animation-name: rotate;
  animation-duration: 6s;
  animation-timing-function: cubic-bezier(0.43, 0.84, 0.61, 0.14);
  animation-iteration-count: infinite;

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-2520deg);
    }
  }
`;

export function BusinessIndicator() {
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => onBusinessChange(setIsBusy) as () => void);

  if (!isBusy) {
    return null;
  }

  return (
    <Container>
      <Icon title="Communicating..." />
    </Container>
  );
}
