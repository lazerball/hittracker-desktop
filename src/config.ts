import { app as electronApp } from 'electron';
import * as path from 'path';
//import * as jetpack from 'fs-jetpack';
//import * as _ from 'lodash';

export const getConfig = (env: string, debug: boolean) => {
    const platform = process.platform;
    const arch = process.arch;
    const simpleArch = arch === 'win32' ? 'win32' : 'unix';
    const userDataPath = electronApp.getPath('userData');

    const hostName = 'localhost';
    const useBundledPackages = true;

    let packageDir = '';
    if (useBundledPackages) {
        packageDir = 'bundled';
    }
    const app = {
        debug: debug,
    };

    const hitTrackerAppDir = path.join(packageDir, `HitTracker-${platform}`);
    // @todo: php shouldn't generally be bundled for nix, but maybe for flatpak?
    const php = {
        bin: 'php',
        phpIni: path.join(hitTrackerAppDir, 'etc', 'php', 'php.ini'),
        env: {
            PHPRC: path.join(hitTrackerAppDir, 'etc', 'php', 'php.ini'),
            PHP_INI_SCAN_DIR: path.join(hitTrackerAppDir, 'etc', 'php', simpleArch),
        }
    };
    if (platform === 'win32') {
        php.bin = `${packageDir}/php-${platform}-${arch}/php.exe`;
    }

    const hitTracker = <any> {
        bin: path.join(hitTrackerAppDir, 'bin', 'console'),
        appDir: hitTrackerAppDir,
        webDir: path.join(hitTrackerAppDir, 'web'),
        uploadDir: path.join(userDataPath, 'media'),
        databasePath: path.join(userDataPath, 'hittracker.db'),
        rootUri: '/',
        port: 8088,
        url: '',
    };

    hitTracker.env = {
        SYMFONY__VAR_DIR: path.join(userDataPath, 'symfony'),
        SYMFONY__UPLOAD_DIR:  hitTracker.uploadDir,
        SYMFONY__DATABASE_PATH: hitTracker.databasePath,
        SYMFONY__BUILD_TYPE: 'electron',
        // @todo: generate on app install
        SYMFONY__SECRET: 'KtY0RcymRPHx5ocfeJEU4kC6lQ00ihpSCCmf66KS5ZmrD',
        SYMFONY_DEBUG: debug ? 'true' : 'false',
        SYMFONY_ENV: env == 'production' ? 'prod' : 'dev',
    };
    hitTracker.env = Object.assign({}, hitTracker.env, php.env);

    const htc = Object.assign({}, hitTracker);
    htc.scheme = 'http';
    if (htc.port !== 80 && htc.port !== 443) {
        htc.port = `:${htc.port}`;
    }
    hitTracker.url = `${htc.scheme}://${hostName}${htc.port}${htc.rootUri}`;

    const fastCgi = {
        bin: 'php-fpm',
        args: [
            '-p', path.join(userDataPath, 'php'),
            '-y', path.join(hitTrackerAppDir, 'etc' , 'php-fpm', 'php-fpm-electron.conf'),
        ],
        port: 8081,
        host: 'localhost',
        env: hitTracker.env,
    };
    if (platform === 'win32') {
        fastCgi.bin = path.join(packageDir, `php-${platform}-${arch}`, 'php-cgi.exe');
        fastCgi.args = ['-b', `${fastCgi.host}:${fastCgi.port}`];
    }
    fastCgi.args.push(...['-c', php.phpIni]);

    const caddy: any = {
        bin: path.join(packageDir, `caddy-${platform}-${arch}`, 'caddy'),
        args: [
            '-conf', path.join('config_files', 'Caddyfile'),
        ],
        env: {
            SITE_ADDRESS: '127.0.0.1',
            SITE_HOSTNAME: hostName,
            SITE_PORT: hitTracker.port,
            SITE_ROOT: hitTracker.webDir,
            SITE_MEDIA_ROOT: hitTracker.uploadDir,
            FASTCGI_SERVER: fastCgi.host,
            FASTCGI_PORT: fastCgi.port,
        }
    };

    const htDataClient: any = {
        bin: path.join(packageDir, `htdataclient-${platform}-${arch}`, 'htdataclient'),
        args: [
            // '/dev/ttyUSB0',
            '/dev/pts/4',
            `${hitTracker.url}/games/hit`,
            '-c', '1',
        ]
    };
    if (debug) {
        htDataClient.args.push(...['-l', 'debug']);
    }

    return {app, caddy, fastCgi, hitTracker, htDataClient, php};
};
