import path from 'node:path';

export interface StorePaths {
  rootDir: string;
  settingsFile: string;
  projectsFile: string;
  entriesFile: string;
}

export const STORE_DIRECTORY_NAME = 'store';

export const resolveStorePaths = (rootDir: string): StorePaths => ({
  rootDir,
  settingsFile: path.join(rootDir, 'settings.json'),
  projectsFile: path.join(rootDir, 'projects.json'),
  entriesFile: path.join(rootDir, 'entries.json')
});

export const resolveAppDataStorePaths = (userDataDir: string): StorePaths =>
  resolveStorePaths(path.join(userDataDir, STORE_DIRECTORY_NAME));
