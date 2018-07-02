import * as log from 'electron-log';
import * as jetpack from 'fs-jetpack';
import * as path from 'path';
import { spawn, spawnPromise } from 'spawn-rx';

const appendEnvVars = (envVars: any) => {
  return { ...envVars, ...process.env };
};

export const firstRun = async (config: any) => {
  // make directories we need
  ['php', 'postgres', 'media', path.join('symfony', 'logs'), path.join('symfony', 'cache')].forEach(dir => {
    jetpack.dir(path.join(config.app.userDataPath, dir));
  });

  const runHitTrackerCmd = async (subCommand: string, args?: any[]) => {
    const commandArgs = [config.hitTracker.bin, subCommand, '--no-interaction'];
    if (args) {
      commandArgs.push(...args);
    }

    const envVars = appendEnvVars(config.hitTracker.env);
    await spawnPromise(config.php.bin, commandArgs, { env: envVars }).then(
      x => log.info(x), // needs to be log.debug
      e => {
        log.error(`ERROR: ${e}`);
      }
    );
  };

  await runHitTrackerCmd('cache:clear');

  await runHitTrackerCmd('doctrine:database:create', ['--if-not-exists']);

  await runHitTrackerCmd('doctrine:migrations:migrate');
};

const processLogger = (msg: any) => {
  log.debug(msg);
};

const processErrorLogger = (msg: any) => {
  log.error(msg);
};

export const initDatabase = async (config: any) => {
  if (jetpack.exists(path.join(config.postgreSql.dataDir, 'PG_VERSION'))) return;

  try {
    jetpack.dir(config.postgreSql.dataDir, { mode: 0o700 });
    await spawnPromise(config.postgreSql.initDbBin, config.postgreSql.initDbArgs);
  } catch (error) {
    log.error(error);
  }
};
export const startDatabase = (config: any) => {
  const postgreSql = spawn(config.postgreSql.bin, config.postgreSql.args, {
    split: true,
    cwd: config.postgreSql.binDir, // the dlls are located in the bin dir on windows
  }).subscribe(log.debug, log.error);

  return postgreSql;
};

export const startWebApp = async (config: any) => {
  const phpFpm = spawn(config.fastCgi.bin, config.fastCgi.args, {
    split: true,
    env: appendEnvVars(config.fastCgi.env),
  }).subscribe(processLogger, processErrorLogger);

  const caddy = spawn(config.caddy.bin, config.caddy.args, {
    env: appendEnvVars(config.caddy.env),
  }).subscribe(processLogger, processErrorLogger);

  return [caddy, phpFpm];
};

export const startDeviceMediator = (config: any) => {
  const hitTrackerDeviceMediator = spawn(config.hitTrackerDeviceMediator.bin, config.hitTrackerDeviceMediator.args, {
    split: true,
    env: appendEnvVars({ELECTRON_VERSION: process.versions.electron}),
  }).subscribe(log.debug, log.error);

  return hitTrackerDeviceMediator;
};
