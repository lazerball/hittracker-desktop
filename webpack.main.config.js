const nodeExternals = require('webpack-node-externals');

module.exports = {
  externals: [nodeExternals()],
  entry: {
    index: './src/main/index.ts',
    'sse-pubsub': './src/main/sse-pubsub.ts',
    'device-mediator': './src/main/device-mediator.ts',
  },
  output: {
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: '../../tsconfig.main.json',
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.json', '.ts', '.tsx'],
  },
};
