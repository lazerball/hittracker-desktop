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
