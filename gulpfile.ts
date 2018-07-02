// tslint:disable: no-console
import * as path from 'path';

import * as gulp from 'gulp';

// tslint:disable-next-line: no-implicit-dependencies
import * as download from 'download';
import * as jetpack from 'fs-jetpack';

const fetchPhpExtensions = (unpackDir: string, platform: string, arch: string) => {
  if (platform !== 'win32') {
    return;
  }
  // @todo: don't use http url for getting php
  const phpArch = arch === 'ia32' ? 'x86' : arch;

  const apcuUrl = `https://windows.php.net/downloads/pecl/releases/apcu/5.1.9/php_apcu-5.1.9-7.2-nts-vc15-${phpArch}.zip`;
  const apcuDir = path.join('bundled', `php-ext-apcu-${platform}-${arch}`);

  jetpack.dir(apcuDir);

  download(apcuUrl, apcuDir, { extract: true }).then(
    () => {
      jetpack.move(path.join(apcuDir, 'php_apcu.dll'), path.join(unpackDir, 'php_apcu.dll'));
      jetpack.move(path.join(apcuDir, 'LICENSE'), path.join(path.dirname(unpackDir), 'APCU_LICENSE'));
      jetpack.remove(apcuDir);
      console.log('Successfully downloaded apcU');
    },
    (error: any) => {
      console.log(error);
    }
  );

  const astUrl = `https://windows.php.net/downloads/pecl/releases/ast/0.1.6/php_ast-0.1.6-7.2-nts-vc15-${phpArch}.zip`;
  const astDir = path.join('bundled', `php-ext-ast-${platform}-${arch}`);

  jetpack.dir(astDir);

  download(astUrl, astDir, { extract: true }).then(
    () => {
      jetpack.move(path.join(astDir, 'php_ast.dll'), path.join(unpackDir, 'php_ast.dll'));
      jetpack.move(path.join(astDir, 'LICENSE'), path.join(path.dirname(unpackDir), 'AST_LICENSE'));
      jetpack.remove(astDir);
      console.log('Successfully downloaded ast');
    },
    (error: any) => {
      console.log(error);
    }
  );

  const xdebugArch = arch === 'x64' ? '-x86_64' : '';
  const xdebugUrl = `https://xdebug.org/files/php_xdebug-2.6.0.1-vc15-nts${xdebugArch}.dll`;
  const xdebugDir = path.join('bundled', `php-ext-xebug-${platform}-${arch}`);

  jetpack.dir(xdebugDir);

  download(xdebugUrl, xdebugDir).then(
    () => {
      jetpack.move(path.join(xdebugDir, 'php_xdebug.dll'), path.join(unpackDir, 'php_xdebug.dll'));
      jetpack.remove(xdebugDir);
      console.log('Successfully downloaded ast');
    },
    (error: any) => {
      console.log(error);
    }
  );
};

const fetchPhp = (unpackDir: string, platform: string, arch: string) => {
  if (platform !== 'win32') {
    return;
  }
  const phpArch = arch === 'ia32' ? 'x86' : arch;
  const url = `https://windows.php.net/downloads/releases/php-7.2.6-nts-Win32-VC15-${phpArch}.zip`;
  download(url, unpackDir, { extract: true }).then(
    () => {
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

      console.log('Successfully downloaded PHP');
      fetchPhpExtensions(path.join(unpackDir, 'ext'), platform, arch);
    },
    (error: any) => {
      console.log(error);
    }
  );
};

const fetchHitTracker = (unpackDir: string, platform: string) => {
  if (jetpack.exists(unpackDir)) {
    return;
  }
  const hitTrackerVersion = '0.2.7';
  const file = `HitTracker-electron-${platform}-${hitTrackerVersion}.tar.bz2`;
  const url = `https://github.com/lazerball/HitTracker/releases/download/${hitTrackerVersion}/${file}`;
  download(url, unpackDir, { extract: true }).then(
    () => {
      console.log('Successfully downloaded HitTracker');
    },
    (error: any) => {
      console.log(error);
    }
  );
};

const fetchCaddy = (unpackDir: string, platform: string, arch: string) => {
  if (jetpack.exists(unpackDir)) {
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

  download(url, unpackDir, { extract: true }).then(
    () => {
      ['init', 'CHANGES.txt', 'README.txt'].forEach(file => {
        jetpack.remove(path.join(unpackDir, file));
      });
      console.log('Sucessfully downloaded caddy');
    },
    (error: any) => {
      console.log(error);
    }
  );
};

const fetchPostgreSql = (unpackDir: string, platform: string, arch: string) => {
  if (jetpack.exists(unpackDir)) {
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

  const filesToRemove = ['doc', 'includes', 'pgAdmin 4', 'pgAdmin 4.app', path.join('share', 'man'), 'stackbuilder', 'symbols', 'StackBuilder'];
  download(url, unpackDir, { extract: true }).then(
    () => {
      filesToRemove.forEach(file => {
        jetpack.remove(path.join(unpackDir, 'pgsql', file));
      });
      console.log(`Sucessfully downloaded PostgreSQL ${version}`);
    },
    (error: any) => {
      console.log(error);
    }
  );
};

gulp.task('bundle-third-party', () => {
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
