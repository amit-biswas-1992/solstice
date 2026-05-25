import path from 'node:path';

export interface StorePaths {
  rootDir: string;
  currentFile: string;
  snapshotsDir: string;
  settingsFile: string;
  projectsFile: string;
  entriesFile: string;
}

export const STORE_DIRECTORY_NAME = 'store';

export const resolveStorePaths = (rootDir: string): StorePaths => ({
  rootDir,
  currentFile: path.join(rootDir, 'current.json'),
  snapshotsDir: path.join(rootDir, 'snapshots'),
  settingsFile: path.join(rootDir, 'settings.json'),
  projectsFile: path.join(rootDir, 'projects.json'),
  entriesFile: path.join(rootDir, 'entries.json')
});

export const resolveAppDataStorePaths = (userDataDir: string): StorePaths =>
  resolveStorePaths(path.join(userDataDir, STORE_DIRECTORY_NAME));

export const resolveSnapshotPaths = (rootDir: string, snapshotId: string): StorePaths => {
  const snapshotRoot = path.join(resolveStorePaths(rootDir).snapshotsDir, snapshotId);
  return {
    rootDir: snapshotRoot,
    currentFile: path.join(snapshotRoot, 'current.json'),
    snapshotsDir: path.join(snapshotRoot, 'snapshots'),
    settingsFile: path.join(snapshotRoot, 'settings.json'),
    projectsFile: path.join(snapshotRoot, 'projects.json'),
    entriesFile: path.join(snapshotRoot, 'entries.json')
  };
};
