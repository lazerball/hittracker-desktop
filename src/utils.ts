import { app } from 'electron';
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

// electron-is-dev package is used by various dependencies, so we map our var to theirs
export const setElectronIsDev = (debug: boolean) => {
  if (process.env.ELECTRON_IS_DEV === undefined && debug) {
    process.env.ELECTRON_IS_DEV = '1';
  }
};

export const isDev = () => {
  if (process.env.ELECTRON_ENV === undefined) {
    return process.defaultApp || /node_modules[\\/]electron[\\/]/.test(process.execPath);
  }
  return process.env.ELECTRON_ENV === 'development';
};

export const isDebug = () => {
  if (isDev()) return true;

  if (process.env.ELECTRON_DEBUG === undefined) return false;

  return process.env.ELECTRON_DEBUG === '1';
};

export const getVendoredFilesRootDir = () => {
  if (isPackaged()) {
    if (process.resourcesPath === undefined) {
      return '';
    }
    return process.resourcesPath;
  } else {
    return app.getAppPath();
  }
};
