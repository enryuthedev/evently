module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // react-native-worklets plugin must be listed last (required by Reanimated 4,
    // which NativeWind pulls in as a peer). Harmless if Reanimated is unused.
    plugins: ['react-native-worklets/plugin'],
  };
};
