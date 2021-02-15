- Gist API Doc: https://docs.github.com/en/rest/reference/gists
- Monaco React Doc: https://github.com/suren-atoyan/monaco-react

## Features

- Create & remove gists and files from them
- Open gistº link
- Autosave every 5 seconds (configurable)
- Full history visible through Github's page (follow link)
- Auto refresh if await for more than 5 seconds (configurable)
- Installable
- Mobile support (editor is very simplified)
- Search filters by name (by cached content in future)
- Tutorial
- Intense caching
- Shortcuts (try CMD/CTRL + B)
- Starred gists

- Powerful editor on desktop
  - It's VS Code's Monaco Editor
  - Handles multi-selection
  - Find
  - Highlight
  - Syntax
  - ...

- Settings saved into a hidden gist
  - Settings are consistent across devices
  - Local storage as backup

## Log

### [2021-02-14]

- Refactor settings to add 'memory.json' file

- Save gist history
  - Show previously open gists (not just yours)

- <<< Display number of comments if comments?
- Drag and drop files across gists
- Add display sidebar config option

- Search should include all files' content in storage
  - `localforage.iterate()` must help

- Markdown: ~ ~ ~~should strike text~~ ~ ~
  - Don't know how to do it

- Button "INDEX GISTS"
  - Triggers a full download of all gists
  - Carefully, one by one
  - Change button to stop

- LONG: Offline support
  - Should render without issues
  - Should save operation until back online

### [2021-02-12](https://gist.github.com/b02fa55a018d2532f8a81f479c95a8cb9)

### Feedback
- ~~Preview Markdown by default in Mobile~~
  - ~~Edit on touch~~
- Guest mode
- ~~On mobile keyboard takes screen space~~
- ~~Backspace in search field looses focus? WTF~~

### Shortcuts
- ~~CTRL+B => `document.querySelector('aside').style.display = 'none'`~~
- ~~CTRL+TAB `history().goBack()` o "next file"~~
- ~~CTRL+SHIFT+TAB `history.goForward()` o "prev file"~~

#### Not possible, using CTRL instead
- ~~CMD+W: "close gist and focus tree"~~
- ~~CMD+N: `createGist()`~~
- ~~CMD+T: `addTabToGist()`~~

#### Details
- ~~`class Keyboard {}`~~
- ~~Configurable via file in settings `shortcuts.ts`~~
- Use shortcut
- Arrow navigation on tree

### Other features

- ~~Favourite gists~~
  - ~~Use starred API~~
    - ~~https://docs.github.com/en/rest/reference/gists#list-starred-gists~~

###  [2021-02-10](https://gist.github.com/amatiasq/73a3b78622533205eac1ac6cfbee231e)

~~PRIORIZE THIS LIST~~

- ~~WPA (make installable)~~
- ~~Replace Monaco Editor with textarea in mobile (touch screen detection?)~~

- ~~**onPageFocus if 5+ mins (to settings: REFRESHAL_RATE) without looking fetch again**~~
  - ~~EVEN IF CHANGES!!!~~
    - ~~Update: no, if changes we leave as it is because that's not going to happen from a visibility change~~

- ~~Autosave to 5 secs~~
  - ~~To settings~~

- ~~Update language on filename change (should be happening already)~~
  - ~~**cambiar `defaultLanguage` a `language`**~~

- ~~Revisar `language` en JS snippet~~

- ~~save settings to gist file~~
  - ~~cache to local storage~~
  - ~~should be hidden from list~~
  - ~~should be destroyed and re-create when in position 20+~~
  - ~~asume missing if there is one on first fetch~~
  - ~~settings button opens settings gist~~

- ~~Error when new filename left untouched~~
- ~~Focus on editor when file created~~
- ~~Back button should go back~~~
- ~~Business indicator~

- ~~LOCALSTORAGE PERFORMANCE ISSUES~~

- Favourite gists
  - ~~to local storage, gist to always be requested and listed first~~
  - ~~save to settings~~

- ~~Display dates~~ nah
  - ~~if year is current not show~~
  - ~~if month is not current don't show~~

- ~~On github button click also copy to clipboard~~
  - ~~double click maybe?~~
  - ~~right click? meh~~
  - ~~LONG PRESS (0.5ms?) / shift+click~~

- ~~LONG: When no gist open display static tutorial~~
