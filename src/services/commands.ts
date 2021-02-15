type Executor = () => void;

export type CommandName =
  | 'createFile'
  | 'createGist'
  | 'goBack'
  | 'goForward'
  | 'goHome'
  | 'hideSidebar'
  | 'nextFile'
  | 'prevFile'
  | 'saveCurrentFile'
  | 'settings';

const commands: Partial<Record<CommandName, Executor>> = {};

export function registerCommand(name: CommandName, execute: Executor) {
  commands[name] = execute;
}

export function getCommand(name: CommandName): Executor | null {
  return commands[name] || null;
}
