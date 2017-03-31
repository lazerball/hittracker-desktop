const jetpack = require('fs-jetpack');
// https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#ignore
//  given an absolute file path, returns true if the file is ignored, or false if the file is kept.
const ignoreFilter = (path) => {
    const excludes = [
        '/node_modules/\\.bin($|/)',
        '/node_modules/electron($|/)',
        '/node_modules/electron-prebuilt(-compile)?($|/)',
        '/node_modules/electron-packager($|/)',
        '\\.git($|/)',
        '\\.o(bj)?$',
    ];

    if (excludes.some(pattern => path.match(pattern))) {
        return true;
    }
    const includes = [
        '^$', // needed to catch the current directory
        '^/node_modules',
        '^/src',
        '^/types',
        '^/package.json$',
    ];

    return !includes.some(pattern => path.match(pattern));
};


const afterExtract = (extractPath, electronVersion, platform, arch, done) => {
    jetpack.copy('./config_files', `${extractPath}/config_files`);

    jetpack.copy('./bundled', `${extractPath}/bundled`, {
        matching: [`*-${platform}/**`, `*-${platform}-${arch}/**`],
    });

    done();
};

const forgeConfig = {
    make_targets: {
        win32: [
            'squirrel',
            'zip',
        ],
        darwin: [
            'zip',
        ],
        linux: [
            'zip',
        ],
    },
    electronPackagerConfig: {
        asar: true,
        ignore: ignoreFilter,
        afterExtract: [
            afterExtract,
        ],
        appCopyright: 'LazerBall',
        appBundleId: 'com.lazerball.HitTracker',
        appCategoryType: 'public.app-category.games',
        win32metadata: {
            CompanyName: 'LazerBall',
            productName: 'HitTracker',
        },
    },
    electronWinstallerConfig: {
        name: 'HitTracker',
    },
    github_repository: {
        owner: 'lazerball',
        name: 'hittracker-desktop',
    },
};
module.exports = forgeConfig;
