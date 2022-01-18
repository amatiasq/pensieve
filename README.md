# [Pensieve](https://pensieve.amatiasq.com)

Notes saved in your private Github repository.

## Features

- [Configurable](https://pensieve.amatiasq.com/settings) for settings and shortcuts (`CMD+,`)
- Installable from Chrome. This is required for some shortcuts to work
- Works offline for notes opened in the past

### Organisation

- First line of the file is the filename
- Folders are created by adding slash (`/`) to the filename
- Change syntax highlighting by adding extension to the filename
- Sorted by creation date
- Star notes you want always at the top

### Writing

- Markdown enabled by default
- Autosave after 5 seconds of inactivity
- History of changes visible in Github as commits
- Same text editor as VS Code (Monaco editor) which includes
  - Automatic identation
  - Syntax highlighting
  - Multiple cursors
  - Typescript validation
- Convert regex matches into links. Default settings converts [user/repo] into a Github link
- Custom highlighting with regex. Default settings show ~~strikethrough~~ and @user in different colors

## Caveats

- When switching devices notes list is not updated, refresh the page to force update
- Opening a note takes a few seconds on mobile for unknown reason

## Changelog

### 1.1 Custom highlighting

![Showcase](https://user-images.githubusercontent.com/1533589/149818231-7f4483b1-30a5-49c8-a2e9-c525d6927797.png)

Pensieve 1.1 release has been successful with new features like

- [custom/links]
- custom highlighting as ~~strikethrough~~ or @username
- all based on RegExp and documented by example in Settings [CMD+,]

After a year of usage Pensieve has generated

- 6500 commits
- `16Mb` of data of which
  - one third is actual notes content
  - another third is metadata
  - and the remaining third is git files

```sh
~/pensieve-data main > du -sh . .* *
 16M    .
5.2M    .git
4.8M    meta
5.5M    note
4.0K    settings.json
4.0K    shortcuts.json
```
