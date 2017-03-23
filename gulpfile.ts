import * as gulp from 'gulp';
import * as jetpack from 'fs-jetpack';
import * as download from 'download';

const fetchPhp = (unpackDir: string, platform: string, arch: string) => {
    if (platform !== 'win32') {
        return;
    }
    // @todo: don't use http url for getting php
    const phpArch = arch === 'ia32' ? 'x32' : arch;
    const url = `http://windows.php.net/downloads/releases/php-7.1.2-nts-Win32-VC14-${phpArch}.zip`;
    download(url, unpackDir, { extract: true }).then(() => {
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
            'php_pgsql.dll',
            'php_phpdbg_webhelper.dll',
            'php_snmp.dll',
            'php_soap.dll',
            'php_tidy.dll',
            'php_xmlrpc.dll',
        ];

        cleanExtList.forEach((file) => {
            jetpack.remove(`${unpackDir}/ext/${file}`);
        });

        console.log('Successfully downloaded PHP');
    });
};

const fetchDataClient = (unpackDir: string, platform: string, arch: string) => {
    const packageArch = arch === 'ia32' ? 'x32' : arch;
    const ext = platform === 'win32' ? 'zip' : 'tar.xz';
    const url = `https://github.com/lazerball/htdataredirector/releases/download/0.7.9/htdataclient-${platform}-${packageArch}-0.7.9.${ext}`;
    download(url, unpackDir, { extract: true, strip: 1 }).then(() => {
        console.log('Successfully downloaded htDataClient');
    }, (error: any) => {
        console.log(error);
    });
};

const fetchHitTracker = (unpackDir: string, platform: string) => {
    const ext = platform === 'win32' ? 'zip' : 'tar.xz';
    const url = `https://github.com/lazerball/HitTracker/releases/download/0.0.14/HitTracker-electron-${platform}-0.0.14.${ext}`;
    download(url, unpackDir, { extract: true, strip: 1 }).then(() => {
        console.log('Successfully downloaded HitTracker');
    }, (error: any) => {
        console.log(error);
    });
};

const fetchCaddy = (unpackDir: string, platform: string, arch: string) => {
    const caddyOs = (platform === 'win32') ? 'windows' : platform;

    const caddyArchMap = {
        ia32: '386',
        x64: 'amd64',
        arm: 'arm',
        arm64: 'arm64',
    };
    const caddyArch = caddyArchMap[arch];
    let caddyArm = '';
    if (caddyArch === 'arm') {
        process.config.variables.hasOwnProperty('arm_version');
        caddyArm = (process.config.variables as any).arm_version;
    }
    const caddyFeatures = [
        'cors',
        'expires',
        'locale',
        'realip',
        'upload',
    ].join(',');

    const url = `https://caddyserver.com/download/build?os=${caddyOs}&arch=${caddyArch}&arm=${caddyArm}&features=${caddyFeatures}`;

    if (jetpack.exists(unpackDir)) {
        return true;
    }
    download(url, unpackDir, { extract: true }).then(() => {
        ['init', 'CHANGES.txt', 'README.txt'].forEach((file) => {
            jetpack.remove(`${unpackDir}/${file}`);
        });
        console.log('Sucessfully downloaded caddy');
    }, (error: any) => {
        console.log(error);
    });
    return true;
};

gulp.task('bundle-third-party', () => {
    const baseUnpackDir = './bundled';
    const arch = process.arch;
    const platform = process.platform;

    return Promise.all([
        fetchDataClient(`${baseUnpackDir}/htdataclient-${platform}-${arch}`, platform, arch),
        fetchCaddy(`${baseUnpackDir}/caddy-${platform}-${arch}`, platform, arch),
        fetchPhp(`${baseUnpackDir}/php-${platform}-${arch}`, platform, arch),
        fetchHitTracker(`${baseUnpackDir}/HitTracker-${platform}`, platform),
    ]);
});
