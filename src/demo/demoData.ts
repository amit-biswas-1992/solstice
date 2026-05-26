import type { StoreSummary, UnlockedStoreSnapshot } from '../types/desktopBridge';

export const demoStore: UnlockedStoreSnapshot = {
  settings: {
    lastOpenedMonth: '2026-05',
    lastSelectedDate: '2026-05-26'
  },
  projects: [
    {
      id: 'project-atlas',
      name: 'Project Atlas',
      color: '#1f4e79',
      createdAt: '2026-05-01T08:00:00.000Z',
      updatedAt: '2026-05-25T08:00:00.000Z'
    },
    {
      id: 'project-journal',
      name: 'Journal',
      color: '#8c5e34',
      createdAt: '2026-05-02T08:00:00.000Z',
      updatedAt: '2026-05-25T08:00:00.000Z'
    },
    {
      id: 'project-ops',
      name: 'Ops',
      color: '#2f6b5f',
      createdAt: '2026-05-03T08:00:00.000Z',
      updatedAt: '2026-05-25T08:00:00.000Z'
    }
  ],
  entries: {
    '2026-05-05': {
      notes: [
        {
          id: 'note-0505-1',
          text: 'Landing page outline and copy edits',
          projectId: 'project-atlas',
          createdAt: '2026-05-05T08:00:00.000Z',
          updatedAt: '2026-05-05T08:00:00.000Z'
        }
      ],
      tasks: []
    },
    '2026-05-08': {
      notes: [
        {
          id: 'note-0508-1',
          text: 'Personal review notes from the week',
          projectId: 'project-journal',
          createdAt: '2026-05-08T08:00:00.000Z',
          updatedAt: '2026-05-08T08:00:00.000Z'
        }
      ],
      tasks: []
    },
    '2026-05-12': {
      notes: [],
      tasks: [
        {
          id: 'task-0512-1',
          text: 'Update release checklist',
          projectId: 'project-ops',
          done: true,
          createdAt: '2026-05-12T08:00:00.000Z',
          updatedAt: '2026-05-12T08:00:00.000Z'
        }
      ]
    },
    '2026-05-18': {
      notes: [
        {
          id: 'note-0518-1',
          text: 'Design direction for calm editorial mode',
          projectId: 'project-atlas',
          createdAt: '2026-05-18T08:00:00.000Z',
          updatedAt: '2026-05-18T08:00:00.000Z'
        }
      ],
      tasks: [
        {
          id: 'task-0518-1',
          text: 'Check responsive breakpoints',
          projectId: 'project-atlas',
          done: false,
          createdAt: '2026-05-18T08:00:00.000Z',
          updatedAt: '2026-05-18T08:00:00.000Z'
        }
      ]
    },
    '2026-05-24': {
      notes: [],
      tasks: [
        {
          id: 'task-0524-1',
          text: 'Prepare next week planning board',
          projectId: 'project-journal',
          done: false,
          createdAt: '2026-05-24T08:00:00.000Z',
          updatedAt: '2026-05-24T08:00:00.000Z'
        }
      ]
    },
    '2026-05-26': {
      notes: [
        {
          id: 'note-0526-1',
          text: 'Finalize Claude-inspired panel spacing',
          projectId: 'project-atlas',
          createdAt: '2026-05-26T08:00:00.000Z',
          updatedAt: '2026-05-26T08:00:00.000Z'
        },
        {
          id: 'note-0526-2',
          text: 'Move research scraps into Journal',
          projectId: 'project-journal',
          createdAt: '2026-05-26T09:00:00.000Z',
          updatedAt: '2026-05-26T09:00:00.000Z'
        }
      ],
      tasks: [
        {
          id: 'task-0526-1',
          text: 'Review square date cards',
          projectId: 'project-atlas',
          done: false,
          createdAt: '2026-05-26T08:00:00.000Z',
          updatedAt: '2026-05-26T08:00:00.000Z'
        },
        {
          id: 'task-0526-2',
          text: 'Archive resolved notes',
          projectId: 'project-ops',
          done: true,
          createdAt: '2026-05-26T08:30:00.000Z',
          updatedAt: '2026-05-26T08:30:00.000Z'
        }
      ]
    },
    '2026-05-27': {
      notes: [
        {
          id: 'note-0527-1',
          text: 'Record demo walkthrough',
          projectId: 'project-atlas',
          createdAt: '2026-05-27T08:00:00.000Z',
          updatedAt: '2026-05-27T08:00:00.000Z'
        }
      ],
      tasks: [
        {
          id: 'task-0527-1',
          text: 'Organize launch assets',
          projectId: 'project-atlas',
          done: false,
          createdAt: '2026-05-27T08:00:00.000Z',
          updatedAt: '2026-05-27T08:00:00.000Z'
        }
      ]
    }
  }
};

export const demoSummary: StoreSummary = {
  entryCount: Object.keys(demoStore.entries).length,
  lastOpenedMonth: demoStore.settings.lastOpenedMonth,
  lastSelectedDate: demoStore.settings.lastSelectedDate,
  projectCount: demoStore.projects.length
};
