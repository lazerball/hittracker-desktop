import { app } from 'electron';

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
  if (app.isPackaged) {
    if (process.resourcesPath === undefined) {
      return '';
    }
    return process.resourcesPath;
  } else {
    return app.getAppPath();
  }
};
