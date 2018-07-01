export const isDev = () => {
  if (process.env.ELECTRON_IS_DEV === undefined) {
    // /[\\/]electron/.test(process.execPath);
    return process.defaultApp || /node_modules[\\/]electron[\\/]/.test(process.execPath);
  }
  return parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;
};
