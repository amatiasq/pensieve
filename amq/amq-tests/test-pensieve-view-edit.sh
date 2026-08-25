# `view` y `edit` contra un almacén de mentira: un repo desnudo con una nota
# dentro. Lo que se pinta es que el meta/ acabe diciendo lo mismo que la
# primera línea de la nota — que diverjan es la avería que no se ve hasta que
# la web lista un nombre y el fichero tiene otro.

export NOTE_ID=11111111-2222-3333-4444-555555555555

export GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@test
export GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@test

# Un almacén con la nota $1 dentro, y `origin.git` como remoto del que clonan
# los comandos.
make-store() {
  mkdir -p seed/note seed/meta
  printf '%s\n' "$1" > "seed/note/$NOTE_ID"
  cat > "seed/meta/$NOTE_ID.json" <<EOF
{
  "id": "$NOTE_ID",
  "title": "vieja.md",
  "favorite": true,
  "group": "grupo",
  "created": "2020-01-01 00:00:00",
  "modified": "2020-01-01 00:00:00"
}
EOF

  git init --quiet seed
  git -C seed add .
  git -C seed commit --quiet -m seed
  git clone --quiet --bare seed origin.git
}

# El script que se lee por stdin hace de $EDITOR: recibe la ruta de la nota.
edit-note() {
  cat > editor
  chmod +x editor

  EDITOR="$PWD/editor" \
  PENSIEVE_DATA_REPO="$PWD/origin.git" \
  PENSIEVE_EDIT_CLONE="$PWD/clone" \
    amq pensieve edit "$NOTE_ID"
}

view-note() {
  PENSIEVE_DATA_REPO="$PWD/origin.git" \
  PENSIEVE_CACHE="$PWD/cache" \
    amq pensieve view "$1"
}

pushed-meta() {
  git -C origin.git show "HEAD:meta/$NOTE_ID.json"
}

test_pensieve_view_prints_the_note_and_names_an_id_that_is_not_there() {
  make-store $'grupo/vieja.md\ncuerpo'

  [[ "$(view-note "$NOTE_ID")" == $'grupo/vieja.md\ncuerpo' ]]

  error="$(view-note 00000000 2>&1)" && return 1
  [[ "$error" == *00000000* ]]
}

test_pensieve_edit_without_changes_creates_no_commit() {
  make-store $'grupo/vieja.md\ncuerpo'
  before="$(git -C origin.git rev-parse HEAD)"

  output="$(edit-note <<'EOF'
#!/bin/bash
exit 0
EOF
)"

  [[ "$output" == *"sin cambios"* ]]
  [ "$(git -C origin.git rev-parse HEAD)" = "$before" ]
}

test_pensieve_edit_of_the_body_alone_only_moves_modified() {
  make-store $'grupo/vieja.md\ncuerpo'

  edit-note <<'EOF'
#!/bin/bash
printf '%s\n' 'grupo/vieja.md' 'otro cuerpo' > "$1"
EOF

  meta="$(pushed-meta)"
  [ "$(jq -r .title <<< "$meta")" = 'vieja.md' ]
  [ "$(jq -r .group <<< "$meta")" = 'grupo' ]
  [ "$(jq -r .modified <<< "$meta")" != '2020-01-01 00:00:00' ]

  # Los dos ficheros en el mismo commit: uno sin el otro es la divergencia.
  files="$(git -C origin.git show --name-only --format= HEAD)"
  [[ "$files" == *"note/$NOTE_ID"* ]]
  [[ "$files" == *"meta/$NOTE_ID.json"* ]]
}

test_pensieve_edit_of_the_first_line_renames_and_regroups_the_note() {
  make-store $'grupo/vieja.md\ncuerpo'

  edit-note <<'EOF'
#!/bin/bash
printf '%s\n' 'otro grupo/otro título.md' 'cuerpo' > "$1"
EOF

  meta="$(pushed-meta)"
  [ "$(jq -r .title <<< "$meta")" = 'otro título.md' ]
  [ "$(jq -r .group <<< "$meta")" = 'otro grupo' ]
  [ "$(jq -r .created <<< "$meta")" = '2020-01-01 00:00:00' ]
  [ "$(jq -r .favorite <<< "$meta")" = 'true' ]
}

test_pensieve_edit_lets_the_push_bounce_instead_of_merging() {
  make-store $'grupo/vieja.md\ncuerpo'
  git clone --quiet origin.git web
  export WEB="$PWD/web"

  # La web guarda esa misma nota mientras el editor está abierto: el push
  # rebota, y lo que está publicado se queda como estaba.
  edit-note <<'EOF' && return 1
#!/bin/bash
printf '%s\n' 'grupo/desde la web.md' 'cuerpo' > "$WEB/note/$NOTE_ID"
git -C "$WEB" commit --quiet -am 'desde la web'
git -C "$WEB" push --quiet
printf '%s\n' 'grupo/desde la terminal.md' 'cuerpo' > "$1"
EOF

  [[ "$(git -C origin.git show "HEAD:note/$NOTE_ID")" == 'grupo/desde la web.md'* ]]
}

test_pensieve_edit_keeps_the_comment_in_the_note_and_not_in_the_title() {
  make-store $'grupo/vieja.md\ncuerpo'

  edit-note <<'EOF'
#!/bin/bash
printf '%s\n' '// grupo/x.ts' 'cuerpo' > "$1"
EOF

  [ "$(jq -r .title <<< "$(pushed-meta)")" = 'x.ts' ]
  [[ "$(git -C origin.git show "HEAD:note/$NOTE_ID")" == '// grupo/x.ts'* ]]
}
