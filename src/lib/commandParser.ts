import { parseDateKey } from './date';

type ParsedAddCommand = {
  date?: string;
  projectName?: string;
  text: string;
  type: 'add-note' | 'add-task';
};

type ParsedMoveCommand = {
  date: string;
  text: string;
  type: 'move-note' | 'move-task';
};

type ParsedTagCommand = {
  projectName: string;
  text: string;
  type: 'tag-note' | 'tag-task';
};

export type ParsedCommand = ParsedAddCommand | ParsedMoveCommand | ParsedTagCommand;

export const COMMAND_EXAMPLE = 'Try "add task Finish parser for Project Alpha on 2026-05-26"';

const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ');

const isValidDateKey = (value: string) => {
  try {
    parseDateKey(value);
    return true;
  } catch {
    return false;
  }
};

const parseAddCommand = (
  input: string,
  type: 'add-note' | 'add-task',
  verb: 'note' | 'task'
): ParsedAddCommand | null => {
  const lowerInput = input.toLowerCase();
  const prefix = `add ${verb} `;

  if (!lowerInput.startsWith(prefix)) {
    return null;
  }

  let remainder = input.slice(prefix.length).trim();
  let date: string | undefined;
  let projectName: string | undefined;

  const onIndex = remainder.toLowerCase().lastIndexOf(' on ');
  if (onIndex !== -1) {
    const maybeDate = remainder.slice(onIndex + 4).trim();
    if (!isValidDateKey(maybeDate)) {
      throw new Error('Use a YYYY-MM-DD date in your command.');
    }
    date = maybeDate;
    remainder = remainder.slice(0, onIndex).trim();
  }

  const forIndex = remainder.toLowerCase().lastIndexOf(' for ');
  if (forIndex !== -1) {
    projectName = normalizeText(remainder.slice(forIndex + 5));
    remainder = remainder.slice(0, forIndex).trim();
  }

  const text = normalizeText(remainder);
  if (!text) {
    throw new Error(`Tell me what ${verb} text to save.`);
  }

  return {
    type,
    text,
    projectName: projectName || undefined,
    date
  };
};

const parseMoveCommand = (
  input: string,
  type: 'move-note' | 'move-task',
  verb: 'note' | 'task'
): ParsedMoveCommand | null => {
  const match = input.match(new RegExp(`^move ${verb} (.+?) to (\\d{4}-\\d{2}-\\d{2})$`, 'i'));
  if (!match) {
    return null;
  }

  const [, text, date] = match;
  if (!isValidDateKey(date)) {
    throw new Error('Use a YYYY-MM-DD date in your command.');
  }

  return {
    type,
    text: normalizeText(text),
    date
  };
};

const parseTagCommand = (
  input: string,
  type: 'tag-note' | 'tag-task',
  verb: 'note' | 'task'
): ParsedTagCommand | null => {
  const match = input.match(new RegExp(`^tag ${verb} (.+?) with (.+)$`, 'i'));
  if (!match) {
    return null;
  }

  const [, text, projectName] = match;
  return {
    type,
    text: normalizeText(text),
    projectName: normalizeText(projectName)
  };
};

export const parseCommand = (input: string): ParsedCommand => {
  const normalizedInput = normalizeText(input);
  if (!normalizedInput) {
    throw new Error(COMMAND_EXAMPLE);
  }

  return (
    parseAddCommand(normalizedInput, 'add-task', 'task') ||
    parseAddCommand(normalizedInput, 'add-note', 'note') ||
    parseMoveCommand(normalizedInput, 'move-task', 'task') ||
    parseMoveCommand(normalizedInput, 'move-note', 'note') ||
    parseTagCommand(normalizedInput, 'tag-task', 'task') ||
    parseTagCommand(normalizedInput, 'tag-note', 'note') || (() => {
      throw new Error(COMMAND_EXAMPLE);
    })()
  );
};
