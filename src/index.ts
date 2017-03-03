import * as childProcess from 'child_process';
import { app, Menu, BrowserWindow } from 'electron';

import * as xdgBaseDir from 'xdg-basedir';
import * as log from 'electron-log';
import * as jetpack from 'fs-jetpack';

import devMenuTemplate from './menu/dev';
import editMenuTemplate from './menu/edit';
import fileMenuTemplate from './menu/file';

//import isDev from 'electron-is-dev';
const isDev = process.execPath.match(/[\\/]electron/);

const debug = isDev;
const env: string = 'development';

// needed until electron stops storing non-config files in `$XDG_CONFIG_HOME`
// https://github.com/electron/electron/issues/8124
if (!(process.platform in ['win32', 'darwin'])) {
    app.setPath('appData', xdgBaseDir.data);
    app.setPath('userData', `${xdgBaseDir.data}/${app.getName()}`);
}

if (env !== 'production') {
    app.setPath('userData', `${app.getPath('userData')} (${env})`);
}

import * as config from './config';

log.transports.file.file = `${app.getPath('userData')}'/log.txt`;

if (isDev) {
    log.info('Running in development');
} else {
    log.info('Running in production');
}

log.info('Configuration:');
log.info(config);

// tslint:disable-next-line:no-var-requires
require('electron-debug')({enabled: debug, showDevTools: debug});

let mainWindow: Electron.BrowserWindow | null = null;

function startProcesses() {
    const userDataRoot = app.getPath('userData');
    jetpack.dir(`${userDataRoot}/php`);
    jetpack.dir(`${userDataRoot}/media`);
    jetpack.dir(`${userDataRoot}/symfony/logs`);
    jetpack.dir(`${userDataRoot}/symfony/cache`);

    const envVars = Object.assign({}, process.env);

    const fastCgiEnvVars = Object.assign(config.fastCgi.env, envVars);

    const phpFpm = childProcess.spawn(
        config.fastCgi.bin,
        config.fastCgi.args,
        {
            env: fastCgiEnvVars,
        },
    );
    phpFpm.stdout.on('data', (data) => {
        log.debug(data.toString());
    });

    phpFpm.stderr.on('data', (data) => {
        log.debug(data.toString());
    });

    const caddyEnvVars = Object.assign(config.caddy.env, envVars);
    const caddy = childProcess.spawn(
        config.caddy.bin,
        config.caddy.args,
        {
            env: caddyEnvVars,
        },
    );

    caddy.stdout.on('data', (data) => {
        log.debug(data.toString());
    });

    caddy.stderr.on('data', (data) => {
        log.debug(data.toString());
    });

    const htDataClient = childProcess.spawn(
        config.htDataClient.bin,
        config.htDataClient.args,
    );

    htDataClient.stdout.on('data', (data) => {
        log.debug(data.toString());
    });

    htDataClient.stderr.on('data', (data) => {
        log.debug(data.toString());
    });

    return [htDataClient, phpFpm, caddy];
}

const setApplicationMenu = () => {
    const menus = [fileMenuTemplate, editMenuTemplate];
    if (env !== 'production') {
        menus.push(devMenuTemplate);
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', () => {
    setApplicationMenu();
    mainWindow = new BrowserWindow({
        width: 900,
        height: 600,
        webPreferences: {
            nodeIntegration: false, // needed?
            defaultEncoding: 'UTF-8',
        },
    });

    const processes = startProcesses();
    mainWindow.loadURL(config.hitTracker.url);

    mainWindow.on('closed', () => {
        mainWindow = null;
        processes.forEach((process) => {
            process.kill();
        });
    });
});
