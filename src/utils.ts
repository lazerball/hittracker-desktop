import * as path from 'path';

// is a property on app in https://github.com/electron/electron/commit/daf75dd3755c994fdfba3f70686e75f4e4c4a2a2#diff-6ba4c23225436343131188beec8d2370
// but is not in the current 2.x releases.
export const isPackaged = () => {
  const execFile = path.basename(process.execPath).toLowerCase();
  if (process.platform === 'win32') {
    return execFile !== 'electron.exe';
  }
  return execFile !== 'electron';
};

export const isDev = () => {
  if (process.env.ELECTRON_IS_DEV === undefined) {
    // /[\\/]electron/.test(process.execPath);
    return process.defaultApp || /node_modules[\\/]electron[\\/]/.test(process.execPath);
  }
  return parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;
};

export const getAppRootDir = () => {
  if (process.resourcesPath === undefined) return '';
  if (process.platform === 'win32') {
    const dir = process.resourcesPath.replace('\\resources', '');
    return dir.replace(/\\node_modules.*/, '');
  } else {
    const dir = process.resourcesPath.replace('/resources', '');
    return dir.replace(/\/node_modules.*/, '');
  }
};
