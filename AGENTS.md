# pensieve — AGENTS.md

Notes in a private GitHub repo.

## Glossary

- **Note** — a text file with a UUID v4 id. **Its first line is its name**:
  extension, folder and title come from it, and they're stored nowhere else.
  `getMetadataFromContent` is the only authority.
- **Group** — a note's folder, the part left of the `/` in the first line. It
  isn't an entity: it's derived from the text, so renaming the first line moves
  the note to another folder.
- **Snapshot** — a copy of a note whose first line becomes
  `# <original's group> / <today's date>`. It archives a state, so it's created
  without navigating to it and without a star, and the original is bumped above
  it: neither focus nor the top of the list leave the original.
- **Repo-as-store** — there's no database. Each note is two files in the repo
  (`meta/{id}.json` and `note/{id}`), and each save is a commit: the app's
  history *is* the git history.
- **Store** — the `AsyncStore` interface (`readAll`/`read`/`write`/`delete`)
  over file keys. Everything else is middleware wrapping it: `CachedStore`
  (in-memory TTL), `IdbStore` (IndexedDB), `ResilientOnlineStore` (outbox),
  `GHRepoStore` (GitHub), `MixedStore` (joins local and remote).
- **Stale-while-revalidate** — local is painted at once and reconciled with
  remote when it arrives. `MixedStore.readAll` returns remote and writes the
  difference locally; `read` **prefers remote** and only falls back to local
  if it fails.
- **Outbox** — the queue of writes that didn't go out, in IndexedDB
  (`pensieve-outbox`). It survives closing the tab; it drains when the network
  comes back, when focus comes back, or through Background Sync.
- **Leader tab** — of all open tabs, only one drains the outbox and polls
  remote (`isLeader()`); the rest get the result over `BroadcastChannel`.
  Without it, N tabs make N commits of the same change.
- **Circuit breaker** — after 3 server failures in a row, GitHub calls fail
  instantly for 30 s (or until `X-RateLimit-Reset`). It degrades the app to
  local mode instead of hanging it on a dead API.
- **`/halt`** — a route that loads the app **without firing the OAuth
  redirect**. It's the only way to reach the page with a broken token to fix
  it.

## Invariants

- **The OAuth App's `client_secret` can't touch the client bundle.** That's
  why `/auth` exists as a server endpoint: it's the only place the `code` can
  be swapped for a token. Secrets reach `api/auth.ts` as environment
  variables from a gitignored `.env` —the server's is written by `amq pensieve
  secrets`, the local one is read by `amq pensieve local`—, never from
  `config.json`.
- **The API shares the app's origin, so there's no CORS.** `api/` is a Deno
  service only on the `pensieve_internal` network, reached only by the shared
  nginx, which joins that network; the client calls `/auth`, `/commit` and
  `/tarball` on relative paths. Splitting them again brings back a CORS setup
  that has to be right.
- **A cold start reads a tarball, not file by file.** Notes are thousands of
  files and the account has 5000 calls per hour: one per note burns the whole
  hour's rate limit before loading finishes, and the app is left without a
  list. That's why `/tarball` exists —the browser can't ask for it, because
  `api.github.com` redirects to `codeload.github.com`, which doesn't allow the
  app's origin— and why `readDirViaTree` gives up and asks the tarball instead
  of going on: giving up leaves the app reading local, much better than
  spending the hour on a load that won't finish.
- **Preloading is the opposite of the tarball, so it has a brake.** Reading
  offline a note that was never opened means downloading it, exactly the
  per-file request that burns the rate limit. `createPreloader` does it one at a
  time, only in the leader tab and with a per-session budget; whatever doesn't
  fit, the next session takes.
- **A missing object store gets created; it's never assumed to be there.**
  idb-keyval's `createStore` opens the database without a version, so if the
  database exists without its store every read and write throws
  `NotFoundError` forever, silently. Databases are opened through
  [`1-core/idb.ts`](src/1-core/idb.ts), which bumps the version to create the
  missing store.
- **What the tarball downloaded is read from disk when GitHub doesn't
  answer.** The tarball brings the content of **every** note, not just the
  list, and leaves it in `pensieve-dir-cache`. If opening a note asked the API
  again and the API said no —rate limit, expired token, no network—, the app
  would have the note on disk and still open an empty editor. That's why
  `readFile` falls back to the directory cache when the request fails.
  `readDirViaTree` does **not** go there, it uses `requestFile`: what it stores
  is tagged with the new SHA, and old content under a new SHA leaves the note
  stale forever. **And "offline" has to reach that far**:
  `ResilientOnlineStore` rejects `readAll` when `navigator.onLine` is false,
  but **not `read`** — cutting it higher up leaves the note on disk and the app
  saying it can't be read.
- **An empty editor never replaces a failed read.** Not being cached isn't
  "the note is empty": if local wins the race with a default value, the remote
  failure shows up nowhere and saving over it wipes the note. `fetchAndUpdate`
  only answers with local if `isValid` accepts it, and if neither local nor
  remote can, it **fails**; `EditNoteFromUrl` shows the error instead of the
  editor.
- **What the cache stores for each file is its git SHA**, that is
  `sha1("blob " + size + "\0" + content)`, the same one `git/trees` returns.
  It's the only thing that makes the tarball comparable with the next sync:
  with any other hash nothing matches and the whole repo is fetched again, note
  by note.
- **Layers `src/0-dom` … `src/7-components` only import from layers with an
  equal or lower number.** It keeps storage and GitHub out of the UI, and
  `layers/no-upward-import` in `eslint.config.js` checks it.
- **The notes are the off-site copy of everything else.** They're what's
  needed to fix the VPS when the VPS breaks, so pensieve can't end up
  depending on what its notes are for repairing: data lives in a GitHub repo
  (`amatiasq/pensieve-data`) and the app is a PWA with offline writes, so with
  the VPS down notes are read and edited.
- **The critical path is used daily.** Any change to auth, saving or the
  service worker is tested with the real account and with a tab that already
  has pensieve open — an old service worker hides the new deploy.
- **Backing up a repo is cloning it, so `restore` stops at the clone.**
  `amq pensieve backup` leaves a mirror and a bundle; `amq pensieve restore`
  opens it and counts commits and files. Putting it back on GitHub is
  `git push --mirror`, which rewrites the whole remote repo: the command prints
  it and doesn't run it, because a restore that publishes by itself can't be
  rehearsed.
- **The off-site copy isn't made by this command: the NAS pulls it**, with a
  read-only deploy key, and its daily rehearsal clones that mirror. Here only
  the laptop copy is left — two paths copying the same data take twice the
  space.
