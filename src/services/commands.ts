type Executor = () => void;

export type CommandName = 'hideSidebar' | 'saveCurrentFile';

const commands: Partial<Record<CommandName, Executor>> = {};

export function registerCommand(name: CommandName, execute: Executor) {
  commands[name] = execute;
}

export function getCommand(name: CommandName): Executor | null {
  return commands[name] || null;
}
