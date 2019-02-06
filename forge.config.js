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

const copyFilesIntoApp = async (forgeConfig, extractPath, electronVersion, platform, arch) => {
  jetpack.copy('config_files', path.join(extractPath, 'resources', 'config_files'));

  jetpack.copy('bundled', path.join(extractPath, 'resources', 'bundled'), {
    matching: [`*-${platform}/**`, `*-${platform}-${arch}/**`],
  });
};

const cleanElectronReBuildBuildFiles = async (forgeConfig, prunePath, electronVersion, pPlatform, pArch) => {
  const pathsToRemove = jetpack.find(path.join(prunePath, 'node_modules'), { directories: true, files: false, matching: '.deps'});
  for (pathToRemove of pathsToRemove) {
    jetpack.remove(pathToRemove);
  }
};

module.exports = {
  plugins: [
    //['@electron-forge/plugin-auto-unpack-natives'],
    ['@electron-forge/plugin-compile'],
  ],
  packagerConfig: {
    packageManager: 'npm',
    asar: true,
    ignore: ignoreFilter,
    appCopyright: 'LazerBall',
    appBundleId: 'com.lazerball.HitTracker',
    appCategoryType: 'public.app-category.games',
    win32metadata: {
      CompanyName: 'LazerBall Reusable Paintballs',
      productName: 'HitTracker',
    },
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32'],
    },
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: 'HitTracker',
        copyright: 'LazerBall Reusable Paintballs',
      }
    },
  ],
  hooks: {
    packageAfterExtract: copyFilesIntoApp,
    packageAfterPrune: cleanElectronReBuildBuildFiles,
  },
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'lazerball',
          name: 'hittracker-desktop'
        },
        draft: true
      }
    }
  ],
};
