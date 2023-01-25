import styled from '@emotion/styled';

const LoaderWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  @keyframes loader {
    0% {
      top: 36px;
      left: 36px;
      width: 0;
      height: 0;
      opacity: 1;
    }
    100% {
      top: 0px;
      left: 0px;
      width: 72px;
      height: 72px;
      opacity: 0;
    }
  }
`;

const Container = styled.div`
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
`;

const Ripple = styled.div`
  position: absolute;
  border: 4px solid #fff;
  opacity: 1;
  border-radius: 50%;
  animation: loader 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
`;

const Ripple2 = styled.div`
  ${Ripple};
  animation-delay: -0.5s;
`;

export interface LoaderProps {
  onClick?: () => unknown;
}

export function Loader({ onClick }: LoaderProps) {
  return (
    <LoaderWrapper onClick={onClick}>
      <Container>
        <Ripple />
        <Ripple2 />
      </Container>
    </LoaderWrapper>
  );
}
