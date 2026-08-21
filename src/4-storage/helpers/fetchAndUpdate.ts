/**
 * Contesta con lo local (si `isValid` lo da por bueno) y avisa por `patch` de
 * lo que diga el remoto; sin caché contesta el remoto. Si ninguno puede,
 * FALLA: rendirse en silencio pintaba la nota vacía sin rastro del error.
 */
export function fetchAndUpdate<T>(
  local: Promise<T>,
  remote: Promise<T>,
  patch: (x: T) => void,
  isValid: (x: T) => boolean = () => true,
) {
  let answered = false;
  let localDone = false;
  let remoteFailure: { reason: unknown } | null = null;

  return new Promise<T>((resolve, reject) => {
    const answer = (value: T) => {
      answered = true;
      resolve(value);
    };

    remote.then(
      x => {
        if (answered) patch(x);
        else answer(x);
      },
      reason => {
        remoteFailure = { reason };
        // Sin remoto sólo queda lo local; si ya se sabe que no sirve, no hay
        // nada que esperar.
        if (!answered && localDone) reject(reason);
      },
    );

    local.then(
      x => {
        localDone = true;
        if (answered) return;
        if (isValid(x)) answer(x);
        else if (remoteFailure) reject(remoteFailure.reason);
      },
      () => {
        // Que no haya caché no es un fallo: el remoto sigue en camino.
        localDone = true;
        if (!answered && remoteFailure) reject(remoteFailure.reason);
      },
    );
  });
}
