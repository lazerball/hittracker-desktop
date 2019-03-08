import * as ChildProcess from 'child_process';

/**
 * Execute a command cross-platform.
 *
 * @param {string} cmd command to execute e.g. `"npm"`
 * @param {any[]} [args] command argument e.g. `["install", "-g", "git"]`
 * @param {Partial<crossSpawnPromise.CrossSpawnOptions>} [options] additional options.
 * @returns {Promise<Uint8Array>} a promise result with `stdout`
 */

declare function crossSpawnPromise(
  cmd: string,
  args?: (string | number)[],
  options?: Partial<crossSpawnPromise.CrossSpawnOptions>
): Promise<Uint8Array>;

// eslint-disable-next-line no-redeclare
declare namespace crossSpawnPromise {
  interface CrossSpawnOptions extends ChildProcess.SpawnOptions {
    encoding: string;
  }

  interface CrossSpawnError {
    exitStatus: number;
    message: string;
    stack: string;
    stderr: Uint8Array;
    stdout: Uint8Array | null;
  }
}

export = crossSpawnPromise;
