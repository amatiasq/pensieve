# Pensieve

## Next
- [] Sketchpad?
  - Right click => Create note from selection

## Sync
- make queue
- add all notes sorted by modified date
- those notes should be fetched
  - max 1 per second?
  - slow down will proportional to last modified date
    - find function name que hace así: __/‾‾
- when listing notes
  - detect all notes with changed `modified` date
  - add them to queue
- when reading notes
  - remove them from queue

### how
- https://github.com/amatiasq/better-gists/blob/6c5a79cc3908592ed6a53461d48205177d6504f3/src/4-storage/middleware/MixedStore.ts#L17-L38
  - needs to go to Store
  - or emit an event captured by Store
  - put them first

## Nice to have
- Rename group
- Push note to top
- Light theme
- Link {{other notes}}
- Share as gist
- Design settings page
