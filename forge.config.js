const jetpack = require('fs-jetpack');
const path = require('path');

// https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#ignore
//  given an absolute file path, returns true if the file is ignored, or false if the file is kept.
const ignoreFilter = file => {
  const excludes = [
    // '/node_modules',
    /node_modules\/@types/,
    '/node_modules/\\.bin($|/)',
    '/node_modules/electron($|/)',
    '/node_modules/electron-packager($|/)',
    /README(\.md)/i,
    /CHANGELOG(\.md)/i,
    /\.d\.ts$/,
    '\\.git($|/)',
    '\\.o(bj)?$',
  ];
  if (excludes.some(pattern => file.match(pattern))) {
    return true;
  }

  const includes = [
    '^$', // needed to catch the current directory
    '^/.webpack',
    '^/node_modules',
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
  const pathsToRemove = jetpack.find(path.join(prunePath, 'node_modules'), {
    directories: true,
    files: false,
    matching: '.deps',
  });
  for (pathToRemove of pathsToRemove) {
    jetpack.remove(pathToRemove);
  }
};

module.exports = {
  plugins: [
    ['@electron-forge/plugin-auto-unpack-natives'],
    [
      '@electron-forge/plugin-webpack',
      {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/renderer/index.html',
              js: './src/renderer/index.ts',
              name: 'main_window',
            },
          ],
        },
      },
    ],
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
      },
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
          name: 'hittracker-desktop',
        },
        draft: true,
      },
    },
  ],
};
