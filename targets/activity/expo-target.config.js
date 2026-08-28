/**
 * Widget extension that hosts Everly's Live Activity — the Lock Screen / Dynamic
 * Island card that runs for the length of a live event.
 *
 * The bundle id is derived from `ios.bundleIdentifier`, so the dev / preview /
 * production variants each get their own extension automatically.
 *
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = () => ({
  type: "widget",
  name: "EverlyActivity",
  displayName: "Everly",
  // ActivityKit's `ActivityContent` (staleDate) lands in 16.2; everything the
  // widget draws is gated on that, so there's no reason to build lower.
  deploymentTarget: "16.2",
  colors: {
    // Blush rose — the tint iOS uses for system chrome around the activity.
    $accent: "#E6A9B4",
    $widgetBackground: "#FBF8F5",
  },
});
