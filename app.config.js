// Dynamic config layered on top of app.json.
// app.json is loaded first and passed in as `config`; here we override the
// per-variant fields so development / preview / production builds can be
// installed side by side on the same device (each needs a unique bundle id /
// package). Select a variant via the APP_VARIANT env var (see package.json
// scripts and eas.json build profiles).

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) return 'com.get.everly.dev';
  if (IS_PREVIEW) return 'com.get.everly.preview';
  return 'com.get.everly';
};

const getAppName = () => {
  if (IS_DEV) return 'Everly (Dev)';
  if (IS_PREVIEW) return 'Everly (Preview)';
  return 'Everly';
};

const getScheme = () => {
  if (IS_DEV) return 'everly-dev';
  if (IS_PREVIEW) return 'everly-preview';
  return 'everly';
};

export default ({ config }) => ({
  ...config,
  name: getAppName(),
  scheme: getScheme(),
  ios: {
    ...config.ios,
    bundleIdentifier: getUniqueIdentifier(),
  },
  android: {
    ...config.android,
    package: getUniqueIdentifier(),
  },
});
