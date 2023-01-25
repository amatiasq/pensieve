# Bugs

## Empty commits

- Git history is full of empty commits
- Github API to prevent empty commits?

## Search returns unexpected results

- Type "Pensieve" in search field
- First results are OK
- Then you get mostly every note
- Then you get the right ones
- Quite random

# Next

- Right click => Create note from selection
- On new file: text should be already selected
- ~~Mobile tap on markdown preview to cover 100÷ height~~
- Javascript register protocol handler
  - Web Share Target API

## Nice to have

- Rename group
- Push note to top
- Light theme
- Link {{other notes}}
- Share as gist
- Design settings page

## Sync

This will make all notes available offline

- make queue
- add all notes sorted by modified date
- those notes should be fetched
  - max 1 per second?
  - slow down will proportional to last modified date
    - find function name que hace así: `__/‾‾`
      - FOUND: https://youtu.be/mr5xkf6zSzk
- when listing notes
  - detect all notes with changed `modified` date
  - add them to queue
- when reading notes
  - remove them from queue

### how

- https://github.com/amatiasq/pensieve/blob/6c5a79cc3908592ed6a53461d48205177d6504f3/src/4-storage/middleware/MixedStore.ts#L17-L38
  - needs to go to Store
  - or emit an event captured by Store
  - put them first

# Done

- ~~Cypress tests~~

## Markdown (monaco)

- `~~strikethrough~~`
- "quotes show javascript-string-rules"
- show `@mentions` dark blue
  - @google twitter username regex
