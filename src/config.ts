import { app as electronApp } from 'electron';
import * as path from 'path';
//import * as jetpack from 'fs-jetpack';
//import * as _ from 'lodash';

export const getConfig = (env: string, debug: boolean) => {
    const platform = process.platform;
    const arch = process.arch;
    const simplePlatform = platform === 'win32' ? 'win32' : 'unix';
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
    const phpIni = path.join(hitTrackerAppDir, 'etc', 'electron', `php-${simplePlatform}-${env}.ini`);
    const php = {
        bin: 'php',
        phpIni: phpIni ,
        env: {
            PHPRC: phpIni,
            PHP_INI_SCAN_DIR: '',
            PHP_OPCACHE_FILE_CACHE_DIR: path.join(userDataPath, 'symfony', 'opcache'),
        }
    };
    if (platform === 'win32') {
        php.bin = path.join(packageDir, `php-${platform}-${arch}`, 'php.exe');
    }

    const hitTracker = <any> {
        bin: path.join(hitTrackerAppDir, 'bin', 'console'),
        appDir: hitTrackerAppDir,
        webDir: path.join(hitTrackerAppDir, 'public'),
        uploadDir: path.join(userDataPath, 'media'),
        databasePath: path.join(userDataPath, 'hittracker.db'),
        rootUri: '/',
        port: 8088,
        url: '',
    };

    hitTracker.env = {
        HITTRACKER_VAR_DIR: path.join(userDataPath, 'symfony'),
        HITTRACKER_UPLOAD_DIR:  hitTracker.uploadDir,
        HITTRACKER_DATABASE_PATH: hitTracker.databasePath,
        HITTRACKER_BUILD_TYPE: 'electron',
        // @todo: generate on app install
        HITTRACKER_SESSION_SECRET: 'KtY0RcymRPHx5ocfeJEU4kC6lQ00ihpSCCmf66KS5ZmrD',
        SYMFONY_DEBUG: debug ? 'true' : 'false',
        SYMFONY_ENV: env,
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
            '-y', path.join(hitTrackerAppDir, 'etc' , 'electron', 'php-fpm.conf'),
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
            FASTCGI_HOST: fastCgi.host,
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
