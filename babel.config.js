module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Must be before any class-properties transform
      ["@babel/plugin-proposal-decorators", { legacy: true }],
    ],
  };
};
