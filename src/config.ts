import { app as electronApp } from 'electron';
import * as path from 'path';
import * as utils from './utils';

export interface IBaseConfigOptions {
  bin: string;
  port?: number;
  args?: Array<string|number>;
  env?: any;
  [propName: string]: any;
}
const executableName = (name: string) => {
  return process.platform === 'win32' ? `${name}.exe` : name;
};
export const getConfig = (env: string, debug: boolean) => {
  const platform = process.platform;
  const arch = process.arch;
  const simplePlatform = platform === 'win32' ? 'win32' : 'unix';
  const userDataPath = electronApp.getPath('userData');

  const hostName = 'localhost';

  const bundledPackageDir = path.join(utils.getVendoredFilesRootDir(), 'bundled');
  const configFilesDir = path.join(utils.getVendoredFilesRootDir(), 'config_files');
  const app = {
    userDataPath,
    debug,
  };

  const postgreSqlDir = path.join(bundledPackageDir, `postgresql-${platform}-${arch}`, 'pgsql');

  const postgreSql: IBaseConfigOptions = {
    bin: '',
    binDir: path.join(postgreSqlDir, 'bin'),
    dataDir:  path.join(userDataPath, 'postgres'),
    configDir: path.join(configFilesDir, 'postgres'),
    user: 'postgres',
    port: 54320,
  };

  postgreSql.bin = path.join(postgreSql.binDir, executableName('postgres'));
  postgreSql.args = ['-D', postgreSql.configDir, '-c', `data_directory=${postgreSql.dataDir}`, '-p', postgreSql.port, '-h', hostName];
  postgreSql.initDbBin = path.join(postgreSql.binDir, executableName('initdb'));
  postgreSql.initDbArgs = ['-D', postgreSql.dataDir, '-E', 'utf8', '-U', 'postgres', '--locale', electronApp.getLocale()];

  const hitTrackerAppDir = path.join(bundledPackageDir, `HitTracker-${platform}`);
  // @todo: php shouldn't generally be bundled for nix, but maybe for flatpak?
  const phpIni = path.join(hitTrackerAppDir, 'etc', 'electron', `php-${simplePlatform}-${env}.ini`);
  const php: IBaseConfigOptions = {
    bin: executableName('php'),
    phpIni,
    env: {
      PHPRC: phpIni,
      PHP_INI_SCAN_DIR: '',
      PHP_OPCACHE_FILE_CACHE_DIR: path.join(userDataPath, 'symfony', 'opcache'),
    },
  };
  if (platform === 'win32') {
    php.bin = path.join(bundledPackageDir, `php-${platform}-${arch}`, php.bin);
  }

  const hitTracker: IBaseConfigOptions = {
    bin: path.join(hitTrackerAppDir, 'bin', 'console'),
    appDir: hitTrackerAppDir,
    webDir: path.join(hitTrackerAppDir, 'public'),
    uploadDir: path.join(userDataPath, 'media'),
    databasePath: `pgsql://${postgreSql.user}@localhost:${postgreSql.port}/hittracker`,
    rootUri: '/',
    port: 8088,
    url: '',
  };

  hitTracker.env = {
    APP_LOG_DIR: path.join(userDataPath, 'symfony', 'logs'),
    APP_TMP_DIR: path.join(userDataPath, 'symfony', 'tmp'),
    HITTRACKER_UPLOAD_DIR: hitTracker.uploadDir,
    DATABASE_URL: hitTracker.databasePath,
    APP_BUILD_TYPE: 'electron',
    // @todo: generate on app install
    APP_SECRET: 'KtY0RcymRPHx5ocfeJEU4kC6lQ00ihpSCCmf66KS5ZmrD',
    APP_DEBUG: !!debug,
    APP_ENV: env,
  };
  hitTracker.env = { ...hitTracker.env, ...php.env };

  const scheme = 'http';
  let port = '';
  if (hitTracker.port !== 80 && hitTracker.port !== 443) {
    port = `:${hitTracker.port}`;
  }
  hitTracker.url = `${scheme}://${hostName}${port}${hitTracker.rootUri}`;

  const fastCgi = {
    bin: 'php-fpm',
    args: ['-p', path.join(userDataPath, 'php'), '-y', path.join(hitTrackerAppDir, 'etc', 'electron', 'php-fpm.conf')],
    port: 8081,
    host: 'localhost',
    env: hitTracker.env,
  };
  if (platform === 'win32') {
    fastCgi.bin = path.join(bundledPackageDir, `php-${platform}-${arch}`, 'php-cgi.exe');
    fastCgi.args = ['-b', `${fastCgi.host}:${fastCgi.port}`];
  }
  fastCgi.args.push(...['-c', php.phpIni]);

  const ssePubsub: IBaseConfigOptions = {
    bin: require.resolve('./sse-pubsub.js'),
    port: 40000,
  };

  const hitTrackerDeviceMediator: IBaseConfigOptions = {
    bin: require.resolve('@lazerball/hittracker-device-mediator'),
    port: 30010,
    hciDevice: 0,
  };

  hitTrackerDeviceMediator.args = ['--hit-url', `http://localhost:${hitTracker.port}`, '--port', hitTrackerDeviceMediator.port, '--hci-device', hitTrackerDeviceMediator.hciDevice];
  if (debug) {
    hitTrackerDeviceMediator.args.push(...['-v']);
  }
  const caddy: IBaseConfigOptions = {
    bin: path.join(bundledPackageDir, `caddy-${platform}-${arch}`, 'caddy'),
    args: ['-conf', path.join(configFilesDir, 'Caddyfile')],
    env: {
      SITE_ADDRESS: '127.0.0.1',
      SITE_HOSTNAME: hostName,
      SITE_PORT: hitTracker.port,
      SITE_ROOT: hitTracker.webDir,
      SITE_MEDIA_ROOT: hitTracker.uploadDir,
      FASTCGI_HOST: fastCgi.host,
      FASTCGI_PORT: fastCgi.port,
      SSE_PUBSUB_PORT: ssePubsub.port,
      BLE_GATEWAY_PORT: hitTrackerDeviceMediator.port,
    },
  };

  return { app, caddy, fastCgi, hitTracker, hitTrackerDeviceMediator, php, postgreSql, ssePubsub };
};
