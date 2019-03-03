import * as log from 'electron-log';
import * as jetpack from 'fs-jetpack';
import * as path from 'path';
import * as util from 'util';

import * as childProcess from 'child_process';
import * as spawn from 'cross-spawn';
import * as spawnPromise from 'cross-spawn-promise';

/* tslint:disable:no-duplicate-imports no-console */
import { dialog } from 'electron';
console.log(dialog);

const appendEnvVars = (envVars: any) => {
  return { ...envVars, ...process.env };
};

export const firstRun = async (config: any) => {
  // make directories we need
  ['php', 'postgres', 'media', path.join('symfony', 'logs'), path.join('symfony', 'tmp')].forEach(dir => {
    jetpack.dir(path.join(config.app.userDataPath, dir));
  });

  const runHitTrackerCmd = async (subCommand: string, args?: any[]) => {
    const commandArgs = [config.hitTracker.bin, subCommand, '--no-interaction'];
    if (args) {
      commandArgs.push(...args);
    }

    const envVars = appendEnvVars(config.hitTracker.env);
    try {
      const stdout = await spawnPromise(config.php.bin, commandArgs, { env: envVars, encoding: 'utf8' });
      log.info(stdout);
    } catch (error) {
      log.error(`Error running ${commandArgs} STATUS: ${error.exitStatus} OUT: ${error.stderr.toString()}`);
    }
  };

  await runHitTrackerCmd('doctrine:database:create', ['--if-not-exists']);

  await runHitTrackerCmd('doctrine:migrations:migrate');
};

const processLogger = (msg: any) => {
  if (msg instanceof Buffer) {
    log.debug(msg.toString());
  } else {
    log.debug(msg);
  }
};

const processErrorLogger = (msg: any) => {
  if (msg instanceof Buffer) {
    log.error(msg.toString());
  } else {
    log.error(msg);
  }
};

export const initDatabase = async (config: any) => {
  if (jetpack.exists(path.join(config.postgreSql.dataDir, 'PG_VERSION'))) return;
  try {
    jetpack.dir(config.postgreSql.dataDir, { mode: 0o700 });

    await spawnPromise(config.postgreSql.initDbBin, config.postgreSql.initDbArgs, {
      encoding: 'utf8',
      env: config.postgreSql.env,
      cwd: config.postgreSql.binDir, // the dlls are located in the bin dir on windows
    });
  } catch (error) {
    log.error(error);
  }
};
export const startDatabase = async (config: any) => {
  const postgreSql = spawn(config.postgreSql.bin, ['start', ...config.postgreSql.args], {
    windowsHide: true,
    cwd: config.postgreSql.binDir, // the dlls are located in the bin dir on windows
    env: config.postgreSql.env,
  });

  postgreSql.stdout.on('data', processLogger);
  postgreSql.stderr.on('data', processErrorLogger);

  return postgreSql;
};

export const stopDatabase = async (config: any) => {
  const postgreSql = spawn(config.postgreSql.bin, ['stop'], {
    windowsHide: true,
    cwd: config.postgreSql.binDir, // the dlls are located in the bin dir on windows
    env: config.postgreSql.env,
  });

  postgreSql.stdout.on('data', processLogger);
  postgreSql.stderr.on('data', processErrorLogger);
};

export const startPhpFpm = async (config: any) => {
  const phpFpm = spawn(config.fastCgi.bin, config.fastCgi.args, {
    windowsHide: true,
    env: appendEnvVars(config.fastCgi.env),
  });

  phpFpm.stdout.on('data', processLogger);
  phpFpm.stderr.on('data', processErrorLogger);

  return phpFpm;
};

export const startWebServer = async (config: any) => {
  const caddy = spawn(config.caddy.bin, config.caddy.args, {
    windowsHide: true,
    env: appendEnvVars(config.caddy.env),
  });

  caddy.stdout.on('data', processLogger);
  caddy.stderr.on('data', processErrorLogger);

  return caddy;
};

export const startDeviceMediator = async (config: any) => {
  let hitTrackerDeviceMediator;
  hitTrackerDeviceMediator = childProcess.fork(
    config.hitTrackerDeviceMediator.bin,
    config.hitTrackerDeviceMediator.args,
    {
      env: { ELECTRON_VERSION: process.versions.electron },
    }
  );

  const setTimeoutAsync = util.promisify(setTimeout);
  await setTimeoutAsync(4000);
  hitTrackerDeviceMediator.kill('SIGINT');
  await setTimeoutAsync(4000);
  hitTrackerDeviceMediator = childProcess.fork(
    config.hitTrackerDeviceMediator.bin,
    config.hitTrackerDeviceMediator.args,
    {
      env: { ELECTRON_VERSION: process.versions.electron },
    }
  );

  return hitTrackerDeviceMediator;
};

export const startSsePubsub = async (config: any) => {
  const ssePubsub = childProcess.fork(config.ssePubsub.bin, [], {
    env: { SSE_PUBSUB_PORT: config.ssePubsub.port },
  });

  return ssePubsub;
};
