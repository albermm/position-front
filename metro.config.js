const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const fs = require('fs');

const config = async () => {
  const defaultConfig = await getDefaultConfig(__dirname);
  const { resolver: { sourceExts, assetExts } } = defaultConfig;

  return mergeConfig(defaultConfig, {
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    resolver: {
      assetExts: assetExts.filter((ext) => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg', 'jsx', 'ts', 'tsx'],
      extraNodeModules: new Proxy({}, {
        get: (target, name) => path.join(process.cwd(), `node_modules/${name.toString()}`)
      }),
    },
    watchFolders: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '..'),
    ],
    server: {
      enhanceMiddleware: (metroMiddleware) => {
        return (req, res, next) => {
          if (req.url && req.url.startsWith('/assets')) {
            const assetPath = path.join(
              __dirname,
              'node_modules',
              req.url.replace(/^\/assets\//, '')
            );
            fs.readFile(assetPath, (err, data) => {
              if (err) {
                next(err);
              } else {
                res.setHeader('Content-Type', 'application/octet-stream');
                res.end(data);
              }
            });
            return;
          }
          return metroMiddleware(req, res, next);
        };
      },
    },
  });
};

module.exports = config;