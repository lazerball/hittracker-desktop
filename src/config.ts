import { app as electronApp } from 'electron';
//import * as jetpack from 'fs-jetpack';
//import * as _ from 'lodash';

export const getConfig = (env: string, debug: boolean) => {
    const platform = process.platform;
    const arch = process.arch;
    const userDataPath = electronApp.getPath('userData');

    const hostName = 'localhost';
    const useBundledPackages = true;

    let packageDir = '';
    if (useBundledPackages) {
        packageDir = './bundled';
    }
    const app = {
        debug: debug,
    };

    // @todo: php shouldn't generally be bundled for nix, but maybe for flatpak?
    const php = {
        bin: 'php'
    };
    if (platform === 'win32') {
        php.bin = `${packageDir}/php-${arch}-${platform}/php.exe`;
    }

    const hitTrackerAppDir = `${packageDir}/HitTracker`;
    const hitTracker = <any> {
        bin: `${hitTrackerAppDir}/bin/console`,
        appDir: hitTrackerAppDir,
        webDir: `${hitTrackerAppDir}/web`,
        uploadDir: `${userDataPath}/media`,
        databasePath: `${userDataPath}/hittracker.db`,
        rootUri: '/',
        port: 8088,
        url: '',
    };

    hitTracker.env = {
        SYMFONY__VAR_DIR: `${userDataPath}/symfony`,
        SYMFONY__UPLOAD_DIR:  hitTracker.uploadDir,
        SYMFONY__DATABASE_PATH: hitTracker.databasePath,
        SYMFONY__BUILD_TYPE: 'electron',
        // @todo: generate on app install
        SYMFONY__SECRET: 'KtY0RcymRPHx5ocfeJEU4kC6lQ00ihpSCCmf66KS5ZmrD',
        // @TODO make conditional
        SYMFONY_DEBUG: debug ? 1 : 0,
        SYMFONY_ENV: env == 'production' ? 'prod' : 'dev',
    };

    const htc = Object.assign({}, hitTracker);
    htc.scheme = 'http';
    if (htc.port !== 80 && htc.port !== 443) {
        htc.port = `:${htc.port}`;
    }
    hitTracker.url = `${htc.scheme}://${hostName}${htc.port}${htc.rootUri}`;

    const fastCgi = {
        bin: 'php-fpm',
        args: [
            '-p', `${userDataPath}/php`,
            '-y', './config_files/php-fpm.conf',
        ],
        port: 8081,
        host: 'localhost',
        env: hitTracker.env
    };
    if (platform === 'win32') {
        fastCgi.bin = `${packageDir}/php/php-cgi.exe`;
        fastCgi.args = ['-b', `${fastCgi.host}:${fastCgi.port}`];
    }
    fastCgi.args.push(...['-c', './config_files/php.ini']);

    const caddy: any = {
        bin: `${packageDir}/caddy-${arch}-${platform}/caddy`,
        args: [
            '-conf', './config_files/Caddyfile',
        ],
        env: {
            SITE_ADDRESS: '127.0.0.1',
            SITE_HOSTNAME: hostName,
            SITE_PORT: hitTracker.port,
            SITE_ROOT: hitTracker.webDir,
            SITE_MEDIA_ROOT: `${userDataPath}/media`,
            FASTCGI_SERVER: fastCgi.host,
            FASTCGI_PORT: fastCgi.port,
        }
    };
    // @todo different args for dev and prod
    const htDataClient: any = {
        bin: `./bundled/htdataclient-${arch}-${platform}/htdataclient`,
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
