import { ChildProcess } from 'child_process';
import { app, BrowserWindow } from 'electron';

import * as contextMenu from 'electron-context-menu';
import * as log from 'electron-log';
import * as path from 'path';
import * as xdgBaseDir from 'xdg-basedir';

import { getConfig } from './config';
import { firstRun, initDatabase, startDatabase, startDeviceMediator, startPhpFpm, startSsePubsub, startWebServer, stopDatabase } from './external-commands';

import { enableApplicationMenu } from './menu';
import * as utils from './utils';

/* tslint:disable:no-duplicate-imports no-console */
import { dialog } from 'electron';
console.log(dialog);
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// tslint:disable-next-line:no-var-requires
if (require('electron-squirrel-startup')) {
  app.quit();
}

// We still want to show our app name even if running with prebuilt binary
if (!utils.isPackaged()) {
  // tslint:disable-next-line:no-var-requires
  const packageJson = require('../package.json');
  app.setName(packageJson.productName || packageJson.name);
}


const env: string = utils.isDev() ? 'development' : 'production';
const debug = utils.isDebug();
utils.setElectronIsDev(debug);

// needed until electron stops storing non-config files in `$XDG_CONFIG_HOME`
// https://github.com/electron/electron/issues/8124
if (!['win32', 'darwin'].includes(process.platform) && xdgBaseDir.data !== null) {
  app.setPath('appData', xdgBaseDir.data);
  app.setPath('userData', path.join(xdgBaseDir.data, app.getName()));
}

if (env !== 'production') {
  app.setPath('userData', `${app.getPath('userData')} (${env})`);
}
const config = getConfig(env, debug);

log.transports.rendererConsole.format = '{h}:{i}:{s}:{ms} {text}';
log.transports.file.file = path.join(app.getPath('userData'), 'log.txt');

log.info(`ENVIRONMENT: ${env} DEBUG: ${debug}`);

log.info('Configuration:');
log.info(config);

let mainWindow: Electron.BrowserWindow | null = null;

contextMenu();

const shouldQuit = app.makeSingleInstance(() => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

if (shouldQuit) {
  app.quit();
}

const createWindow = async () => {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.

  const processes: ChildProcess[] = [];
  await initDatabase(config);

  await startDatabase(config);

  await firstRun(config);

  enableApplicationMenu();
  mainWindow = new BrowserWindow({
    width: 900,
    backgroundColor: '#FFF', // https://github.com/electron/electron/issues/10025
    height: 600,
    webPreferences: {
      // preload: path.join(__dirname, 'preload-launcher.js'),
      nodeIntegration: false,
      defaultEncoding: 'UTF-8',
    },
  });

  const phpFpm = await startPhpFpm(config);
  processes.push(phpFpm);
  const webServer = await startWebServer(config);
  processes.push(webServer);

  const hitTrackerDeviceMediator = await startDeviceMediator(config);
  processes.push(hitTrackerDeviceMediator);

  const ssePubsub = await startSsePubsub(config);
  processes.push(ssePubsub);

  mainWindow.loadURL(config.hitTracker.url);

  mainWindow.on('closed', async () => {
    processes.forEach((process: ChildProcess) => {
      process.kill();
    });
    await stopDatabase(config);
    mainWindow = null;
  });
};

app.on('ready', createWindow);

app.on('activate', async () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    await createWindow();
  }
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
