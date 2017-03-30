import { app, Menu, BrowserWindow } from 'electron';
import { getConfig } from './config';
import * as xdgBaseDir from 'xdg-basedir';
import * as log from 'electron-log';
import * as jetpack from 'fs-jetpack';
import { spawn, spawnPromise } from 'spawn-rx';

import devMenuTemplate from './menu/dev';
import editMenuTemplate from './menu/edit';
import fileMenuTemplate from './menu/file';
import helpMenuTemplate from './menu/help';

const isDev = /[\\/]electron/.test(process.execPath);

// tslint:disable-next-line:no-var-requires
const packageJson = require('../package.json');

// We still want to show our app name even if running with prebuilt binary
if (app.getName().toLowerCase() == 'electron') {
    app.setName(packageJson.productName || packageJson.name);
}

const env: string = isDev ? 'development' : 'production';
const debug = isDev;

// needed until electron stops storing non-config files in `$XDG_CONFIG_HOME`
// https://github.com/electron/electron/issues/8124
if (!(['win32', 'darwin'].includes(process.platform))) {
    app.setPath('appData', xdgBaseDir.data);
    app.setPath('userData', `${xdgBaseDir.data}/${app.getName()}`);
}

if (env !== 'production') {
    app.setPath('userData', `${app.getPath('userData')} (${env})`);
}
const config = getConfig(env, debug);

log.transports.file.file = `${app.getPath('userData')}/log.txt`;

if (isDev) {
    log.info('Running in development');
} else {
    log.info('Running in production');
}

log.info('Configuration:');
log.info(config);

let mainWindow: Electron.BrowserWindow | null = null;

const appendEnvVars = (envVars: any) => {
   return Object.assign({}, envVars, process.env);
};

const firstRun = async () => {
    const userDataRoot = app.getPath('userData');

    // make directories we need
    ['php', 'media', 'symfony/logs', 'symfony/cache'].forEach((dir) => {
        jetpack.dir(`${userDataRoot}/${dir}`);
    });

    const runHitTrackerCmd = async (subCommand: string, args?: any[]) => {
        const commandArgs  = [config.hitTracker.bin, subCommand, '--no-interaction'];
        if (args) {
            commandArgs.push(...args);
        }

        const envVars = appendEnvVars(config.hitTracker.env);
        await spawnPromise(config.php.bin, commandArgs, {env : envVars}).then(
            (x) => log.info(x), // needs to be log.debug
            (e) => {
                log.error(`ERROR: ${e}`);
            }
        );
    };

    await runHitTrackerCmd('cache:clear');
    // --if-not-exists is broken on sqlite (https://github.com/doctrine/dbal/pull/2402)
    if (!jetpack.exists(config.hitTracker.databasePath)) {
        await runHitTrackerCmd('doctrine:database:create');
    }
    await runHitTrackerCmd('doctrine:migrations:migrate');
};

async function startProcesses() {
    const processLogger = (msg: any) => {
       log.debug(msg);
    };

    const processErrorLogger = (msg: any) => {
        log.error(msg);

    };

    const phpFpm = await spawn(config.fastCgi.bin, config.fastCgi.args,
        {
            split: true,
            env: appendEnvVars(config.fastCgi.env),
        },
    ).subscribe(processLogger, processErrorLogger);

    const caddy = await spawn(config.caddy.bin, config.caddy.args,
        {
            env: appendEnvVars(config.caddy.env),
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
    menus.push(helpMenuTemplate);
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
    await firstRun();

    setApplicationMenu();
    mainWindow = new BrowserWindow({
        width: 900,
        height: 600,
        webPreferences: {
            nodeIntegration: false, // needed?
            defaultEncoding: 'UTF-8',
        },
    });

    const processes = await startProcesses();

    if (debug) {
        //await installExtension('noaneddfkdjfnfdakjjmocngnfkfehhd');
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
