// tslint:disable: no-console
import * as path from 'path';

import * as gulp from 'gulp';

// tslint:disable-next-line: no-implicit-dependencies
import * as download from 'download';
import * as jetpack from 'fs-jetpack';

const fetchPhpExtensions = async (unpackDir: string, platform: string, arch: string) => {
  if (platform !== 'win32') {
    return;
  }
  // @todo: don't use http url for getting php
  const phpArch = arch === 'ia32' ? 'x86' : arch;

  const apcuUrl = `https://windows.php.net/downloads/pecl/releases/apcu/5.1.9/php_apcu-5.1.9-7.2-nts-vc15-${phpArch}.zip`;
  const apcuDir = path.join('bundled', `php-ext-apcu-${platform}-${arch}`);

  jetpack.dir(apcuDir);

  try {
    await download(apcuUrl, apcuDir, { extract: true });
    jetpack.move(path.join(apcuDir, 'php_apcu.dll'), path.join(unpackDir, 'php_apcu.dll'));
    jetpack.move(path.join(apcuDir, 'LICENSE'), path.join(path.dirname(unpackDir), 'APCU_LICENSE'));
    jetpack.remove(apcuDir);
  } catch (error) {
    console.log(error);
  }

  console.log('Successfully downloaded apcU');
  const xdebugArch = arch === 'x64' ? '-x86_64' : '';
  const xdebugFile = `php_xdebug-2.6.0-7.2-vc15-nts${xdebugArch}.dll`;
  const xdebugUrl = `https://xdebug.org/files/${xdebugFile}`;
  const xdebugDir = path.join('bundled', `php-ext-xebug-${platform}-${arch}`);

  jetpack.dir(xdebugDir);

  try {
    await download(xdebugUrl, xdebugDir);
    jetpack.move(path.join(xdebugDir, xdebugFile), path.join(unpackDir, 'php_xdebug.dll'));
    jetpack.remove(xdebugDir);
  } catch (error) {
    console.log(error);
  }
  console.log('Successfully downloaded xdebug');
};

const fetchPhp = async (unpackDir: string, platform: string, arch: string) => {
  if (platform !== 'win32') {
    return;
  }
  const phpArch = arch === 'ia32' ? 'x86' : arch;
  const url = `https://windows.php.net/downloads/releases/php-7.2.8-nts-Win32-VC15-${phpArch}.zip`;
  try {
    await download(url, unpackDir, { extract: true });
    const cleanExtList = [
      'php_com_dotnet.dll',
      'php_enchant.dll',
      'php_ftp.dll',
      'php_gmp.dll',
      'php_imap.dll',
      'php_interbase.dll',
      'php_ldap.dll',
      'php_mysqli.dll',
      'php_oci8_12c.dll',
      'php_odbc.dll',
      'php_pdo_firebird.dll',
      'php_pdo_mysql.dll',
      'php_pdo_oci.dll',
      'php_pdo_odbc.dll',
      'php_phpdbg_webhelper.dll',
      'php_snmp.dll',
      'php_soap.dll',
      'php_tidy.dll',
      'php_xmlrpc.dll',
    ];

    cleanExtList.forEach(file => {
      jetpack.remove(path.join(unpackDir, 'ext', file));
    });
  } catch (error) {
    console.log(error);
  }
  await fetchPhpExtensions(path.join(unpackDir, 'ext'), platform, arch);
  console.log('Successfully downloaded PHP');
};

const fetchHitTracker = async (unpackDir: string, platform: string) => {
  if (jetpack.exists(unpackDir)) {
    console.log('Not downloading HitTracker since we already have it.');
    return;
  }
  const hitTrackerVersion = '0.3.14';
  const file = `HitTracker-electron-${platform}-${hitTrackerVersion}.tar.bz2`;
  const url = `https://github.com/lazerball/HitTracker/releases/download/${hitTrackerVersion}/${file}`;
  try {
    await download(url, unpackDir, { extract: true });
  } catch (error) {
    console.log(error);
  }

  console.log('Successfully downloaded HitTracker');
};

const fetchCaddy = async (unpackDir: string, platform: string, arch: string) => {
  if (jetpack.exists(unpackDir)) {
    console.log('Not downloading Caddy since we already have it.');
    return;
  }

  const caddyOs = platform === 'win32' ? 'windows' : platform;

  const caddyArchMap = {
    ia32: '386',
    x64: 'amd64',
    arm: 'arm',
    arm64: 'arm64',
  } as any;
  let caddyArch = caddyArchMap[arch];
  let caddyArm = '';
  if (caddyArch === 'arm') {
    process.config.variables.hasOwnProperty('arm_version');
    caddyArm = (process.config.variables as any).arm_version;
  }
  caddyArch = `${caddyArch}${caddyArm}`;

  const caddyFeatures = [
    'http.cache',
    'http.cgi',
    'http.cors',
    'http.expires',
    'http.filter',
    'http.forwardproxy',
    'http.grpc',
    'http.locale',
    'http.realip',
    'http.upload',
  ].join(',');
  const url = `https://caddyserver.com/download/${caddyOs}/${caddyArch}?plugins=${caddyFeatures}&license=personal&telemetry=off`;

  try {
    await download(url, unpackDir, { extract: true });
    ['init', 'CHANGES.txt', 'README.txt'].forEach(file => {
      jetpack.remove(path.join(unpackDir, file));
    });
  } catch (error) {
    console.log(error);
  }
  console.log('Sucessfully downloaded caddy');
};

const fetchPostgreSql = async (unpackDir: string, platform: string, arch: string) => {
  if (jetpack.exists(unpackDir)) {
    console.log('Not downloading PostgreSQL since we already have it.');
    return;
  }

  const version = '10.4';
  const subVersion = '1';
  const packageArch = arch === 'x64' && platform !== 'darwin' ? `-${arch}` : '';

  const osMap = {
    darwin: 'osx',
    linux: 'linux',
    win32: 'windows',
  } as any;
  const packageOs = osMap[platform];
  const extension = platform === 'linux' ? 'tar.gz' : 'zip';

  const url = `https://get.enterprisedb.com/postgresql/postgresql-${version}-${subVersion}-${packageOs}${packageArch}-binaries.${extension}?ls=Crossover&type=Crossover`;

  const filesToRemove = [
    'doc',
    'include',
    'pgAdmin 4',
    'pgAdmin 4.app',
    path.join('share', 'man'),
    'stackbuilder',
    'symbols',
    'StackBuilder',
  ];

  try {
    await download(url, unpackDir, { extract: true });
    filesToRemove.forEach(file => {
      jetpack.remove(path.join(unpackDir, 'pgsql', file));
    });
  } catch (error) {
    console.log(error);
  }

  console.log(`Sucessfully downloaded PostgreSQL ${version}`);
};

gulp.task('bundle-third-party', async () => {
  const baseUnpackDir = 'bundled';
  const arch = process.arch;
  const platform = process.platform;

  return Promise.all([
    fetchPostgreSql(path.join(baseUnpackDir, `postgresql-${platform}-${arch}`), platform, arch),
    fetchCaddy(path.join(baseUnpackDir, `caddy-${platform}-${arch}`), platform, arch),
    fetchPhp(path.join(baseUnpackDir, `php-${platform}-${arch}`), platform, arch),
    fetchHitTracker(path.join(baseUnpackDir, `HitTracker-${platform}`), platform),
  ]);
});
