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

// Inside a running `expo start` / `expo run:*` dev server only, skip the
// fingerprint runtime version. The CLI recomputes the fingerprint on *every*
// manifest request (no cache) and on this Windows machine that takes ~10-12s,
// while the dev client gives up after 10s (EXDevLauncherDefaultRequestTimeout),
// so scanning the QR code timed out. The dev client ignores runtimeVersion when
// loading from a local Metro server, so a fixed string is safe there.
// EXPO_DEV_SERVER_ORIGIN is set by the CLI once the dev server is listening and
// is never set for `eas build`, `eas update` or a plain fingerprint resolve, so
// builds and OTA updates keep `policy: fingerprint` and the same hash.
const IN_DEV_SERVER = Boolean(process.env.EXPO_DEV_SERVER_ORIGIN);

export default ({ config }) => ({
  ...config,
  ...(IN_DEV_SERVER ? { runtimeVersion: 'local-dev-server' } : null),
  name: getAppName(),
  scheme: getScheme(),
  ios: {
    ...config.ios,
    bundleIdentifier: getUniqueIdentifier(),
    // Shared with the widget extension (targets/activity), which
    // @bacons/apple-targets syncs to the same group: the app writes the plan
    // snapshot here and the Home Screen widget reads it. One group per variant,
    // derived the same way on the Swift side (see EverlyShared.appGroup).
    entitlements: {
      ...(config.ios && config.ios.entitlements),
      'com.apple.security.application-groups': [`group.${getUniqueIdentifier()}`],
    },
  },
  android: {
    ...config.android,
    package: getUniqueIdentifier(),
  },
});
