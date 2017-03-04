import { app, Menu, BrowserWindow } from 'electron';
import * as xdgBaseDir from 'xdg-basedir';
import * as log from 'electron-log';
import * as jetpack from 'fs-jetpack';
import { spawn } from 'spawn-rx';

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

log.transports.file.file = `${app.getPath('userData')}/log.txt`;

if (isDev) {
    log.info('Running in development');
} else {
    log.info('Running in production');
}

log.info('Configuration:');
log.info(config);


let mainWindow: Electron.BrowserWindow | null = null;

function startProcesses() {
    const userDataRoot = app.getPath('userData');
    jetpack.dir(`${userDataRoot}/php`);
    jetpack.dir(`${userDataRoot}/media`);
    jetpack.dir(`${userDataRoot}/symfony/logs`);
    jetpack.dir(`${userDataRoot}/symfony/cache`);

    const processLogger = (msg: any) => {
       log.debug(msg);
    };

    const processErrorLogger = (msg: any) => {
        log.error(msg);

    };
    const envVars = Object.assign({}, process.env);

    const fastCgiEnvVars = Object.assign(config.fastCgi.env, envVars);

    const phpFpm = spawn(config.fastCgi.bin, config.fastCgi.args,
        {
            split: true,
            env: fastCgiEnvVars,
        },
    ).subscribe(processLogger, processErrorLogger);

    const caddyEnvVars = Object.assign(config.caddy.env, envVars);

    const caddy = spawn(config.caddy.bin, config.caddy.args,
        {
            env: caddyEnvVars,
        },
    ).subscribe(processLogger, processErrorLogger);

    const htDataClient = spawn(config.htDataClient.bin, config.htDataClient.args,
    ).subscribe(processLogger, processErrorLogger);

    return [caddy, htDataClient, phpFpm];
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

const createWindow = async () => {
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
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

    if (debug) {
        // tslint:disable-next-line:no-var-requires
        require('electron-debug')({enabled: debug, showDevTools: debug});
    }

    mainWindow.loadURL(config.hitTracker.url);

    mainWindow.on('closed', () => {
        mainWindow = null;
        processes.forEach((process) => {
            process.unsubscribe();
        });
    });
};

app.on('ready', createWindow);

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
