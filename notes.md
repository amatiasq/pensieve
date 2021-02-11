- Gist API Doc: https://docs.github.com/en/rest/reference/gists
- Monaco React Doc: https://github.com/suren-atoyan/monaco-react

###  [2021-02-10](https://gist.github.com/amatiasq/73a3b78622533205eac1ac6cfbee231e)

~~PRIORIZE THIS LIST~~

- ~~WPA (make installable)~~
- ~~Replace Monaco Editor with textarea in mobile (touch screen detection?)~~

- ~~**onPageFocus if 5+ mins (to settings: REFRESHAL_RATE) without looking fetch again**~~
  - EVEN IF CHANGES!!!
    - Update: no, if changes we leave as it is because that's not going to happen from a visibility change

- ~~Autosave to 5 secs~~
  - ~~To settings~~

- ~~Update language on filename change (should be happening already)~~
  - ~~**cambiar `defaultLanguage` a `language`**~~

- Markdown: ~ ~ ~~should strike text~~ ~ ~

- Revisar `language` en JS snippet
  - ???

- save settings to gist file
  - cache to local storage
  - should be hidden from list
  - should be destroyed and re-create when in position 20+
  - asume missing if there is one on first fetch

- Favourite gists
  - ~~to local storage, gist to always be requested and listed first~~
  - save to settings

- Display dates
  - if year is current not show
  - if month is not current don't show

- On github button click also copy to clipboard
  - ~~double click maybe?~~
  - ~~right click? meh~~
  - LONG PRESS (0.5ms?) / shift+click


- Controls (go one by one)
  - CMD+W means "close gist and focus tree"
    - `class Keyboard {}`
  - Shortcut to create gist
  - Shortcut to add file to gist
  - Shortcut to navigate through files
  - Arrow navigation on tree

- LONG: When no gist open display static tutorial
- LONG: Search should include all files' content in storage

- LONG: Offline support
  - Should render without issues
  - Should save operation until back onli