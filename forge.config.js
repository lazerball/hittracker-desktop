const jetpack = require('fs-jetpack');
const path = require('path');

// https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#ignore
//  given an absolute file path, returns true if the file is ignored, or false if the file is kept.
const ignoreFilter = file => {
  const excludes = [
    '/node_modules/\\.bin($|/)',
    '/node_modules/electron($|/)',
    '/node_modules/electron-prebuilt(-compile)?($|/)',
    '/node_modules/electron-packager($|/)',
    '\\.git($|/)',
    '\\.o(bj)?$',
  ];

  if (excludes.some(pattern => file.match(pattern))) {
    return true;
  }
  const includes = [
    '^$', // needed to catch the current directory
    '^/node_modules',
    '^/src',
    '^/types',
    '^/package.json$',
  ];

  return !includes.some(pattern => file.match(pattern));
};

const afterExtract = (extractPath, electronVersion, platform, arch, done) => {
  jetpack.copy('config_files', path.join(extractPath, 'config_files'));

  jetpack.copy('bundled', path.join(extractPath, 'bundled'), {
    matching: [`*-${platform}/**`, `*-${platform}-${arch}/**`],
  });

  done();
};

const forgeConfig = {
  make_targets: {
    win32: ['squirrel', 'zip'],
    darwin: ['zip'],
    linux: ['zip'],
  },
  electronPackagerConfig: {
    packageManager: 'npm',
    asar: true,
    ignore: ignoreFilter,
    afterExtract: [afterExtract],
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
