# El clon de pensieve-data que comparten `search`, `view` y `edit`. Vive en
# `lib/` porque la carpeta de encima es $PATH y todo `amq-*` de ahí es un
# comando.

PENSIEVE_DATA_REPO="${PENSIEVE_DATA_REPO:-git@github.com:amatiasq/pensieve-data.git}"

# Deja en $1 un clon al día del repo de notas. Clon normal, no `--mirror`:
# hacen falta los ficheros en disco, no sólo el historial.
pensieve_data_clone() {
  local dir="$1"

  if [[ -d "$dir/.git" ]]; then
    echo "==> updating $dir" >&2
    # `--ff-only`: divergir aquí es que la web guardó por su lado, y un merge
    # silencioso lo taparía.
    if ! git -C "$dir" pull --ff-only --quiet; then
      echo "${0##*/}: $dir no avanza en línea recta: tiene cambios propios o divergió." >&2
      echo "${0##*/}: míralo con \`git -C $dir status\`, que aquí no se fusiona nada." >&2
      exit 1
    fi
  else
    echo "==> cloning $PENSIEVE_DATA_REPO into $dir" >&2
    git clone "$PENSIEVE_DATA_REPO" "$dir"
  fi

  # Un almacén de notas es un repo con `note/` dentro. Sin esa carpeta lo
  # apuntado por PENSIEVE_DATA_REPO es otra cosa —el fork viejo de la app, por
  # ejemplo— y el error sería un «no such file or directory» sin explicación.
  if [[ ! -d "$dir/note" ]]; then
    echo "${0##*/}: $dir no tiene note/, no es un almacén de notas." >&2
    echo "${0##*/}: PENSIEVE_DATA_REPO=$PENSIEVE_DATA_REPO" >&2
    exit 1
  fi
}
