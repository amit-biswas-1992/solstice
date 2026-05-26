import { describe, expect, it } from 'vitest';
import { COMMAND_EXAMPLE, parseCommand } from '../lib/commandParser';

describe('parseCommand', () => {
  it('parses add-task with project and date', () => {
    expect(parseCommand('add task Finish parser for Project Alpha on 2026-05-26')).toEqual({
      type: 'add-task',
      text: 'Finish parser',
      projectName: 'Project Alpha',
      date: '2026-05-26'
    });
  });

  it('parses move-note and tag-task commands', () => {
    expect(parseCommand('move note Ship shell layout to 2026-05-27')).toEqual({
      type: 'move-note',
      text: 'Ship shell layout',
      date: '2026-05-27'
    });

    expect(parseCommand('tag task Draft release checklist with Project Beta')).toEqual({
      type: 'tag-task',
      text: 'Draft release checklist',
      projectName: 'Project Beta'
    });
  });

  it('throws a helpful error for unsupported input', () => {
    expect(() => parseCommand('what did I do last week')).toThrow(COMMAND_EXAMPLE);
  });
});
