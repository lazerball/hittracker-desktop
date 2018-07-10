import { ChildProcess } from 'child_process';
import { app, BrowserWindow, Menu } from 'electron';

import * as contextMenu from 'electron-context-menu';
import * as log from 'electron-log';
import * as path from 'path';
import * as xdgBaseDir from 'xdg-basedir';

import { getConfig } from './config';
import { firstRun, initDatabase, startDatabase, startDeviceMediator, startWebApp } from './external-commands';

import * as menus from './menu';
import * as utils from './utils';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// tslint:disable-next-line:no-var-requires
if (require('electron-squirrel-startup')) {
  app.quit();
}

// tslint:disable-next-line:no-var-requires
const packageJson = require('../package.json');

// We still want to show our app name even if running with prebuilt binary
if (app.getName().toLowerCase() === 'electron') {
  app.setName(packageJson.productName || packageJson.name);
}

const env: string = utils.isDev() ? 'development' : 'production';
const debug = utils.isDev();

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

if (utils.isDev()) {
  log.info('Running in development');
} else {
  log.info('Running in production');
}

log.info('Configuration:');
log.info(config);

let mainWindow: Electron.BrowserWindow | null = null;


contextMenu();

const setApplicationMenu = () => {
  const menuTemplates = [menus.file, menus.edit];
  if (env !== 'production') {
    menuTemplates.push(menus.development);
  }
  menuTemplates.push(menus.help);
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplates));
};

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

  await initDatabase(config);
  const dbProcess = startDatabase(config);
  await firstRun(config);

  setApplicationMenu();
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      // preload: path.join(__dirname, 'preload-launcher.js'),
      nodeIntegration: false, // needed?
      defaultEncoding: 'UTF-8',
    },
  });

  const processes = await startWebApp(config);

  const hitTrackerDeviceMediator = startDeviceMediator(config);
  processes.push(dbProcess);
  processes.push(hitTrackerDeviceMediator);

  mainWindow.loadURL(config.hitTracker.url);

  mainWindow.on('closed', () => {
    mainWindow = null;
    processes.forEach((process: ChildProcess) => {
      process.kill();
    });
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
