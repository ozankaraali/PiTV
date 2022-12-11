module.exports = {
  packagerConfig: {
    icon: "./icon",
    // asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'pitv',
        setupIcon: './icon.ico'
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        icon: './icon.png'
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        icon: './icon.png'
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      // config: {
      //   format: 'ULFO',
      // },
    }
  ],
  plugins: [
    // {
    //   name: '@electron-forge/plugin-auto-unpack-natives',
    //   config: {}
    // },
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.js',
              name: 'main_window',
              // preload: {
              //   js: './src/preload.js',
              // },
            },
          ],
        },
      },
    },
  ],
};
