import { Extrapolation, interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";

/**
 * iOS-style push: the screen slides in from the right, the one behind it
 * parallaxes a third of the way out, and a drag from the left edge takes you
 * back.
 *
 * react-native-screen-transitions ships no horizontal push preset — its
 * built-ins are vertical (`SlideFromBottom`) or shared-element — and a screen
 * declared with no transition config gets no dismiss gesture at all. That's why
 * swiping back did nothing on the pushed screens.
 *
 * The gesture activates from the left 40pt only, so horizontal ScrollViews
 * inside a screen (filter strips, photo rows) keep their own drags.
 */
export const SlideFromRight = (config: Record<string, unknown> = {}) => ({
  enableTransitions: true,
  gestureEnabled: true,
  gestureDirection: [{ gesture: "horizontal", area: 40 }],
  screenStyleInterpolator: ({
    progress,
    layouts: {
      screen: { width },
    },
  }: any) => {
    "worklet";

    // 0 = off-screen right, 1 = settled, 2 = covered by the next screen.
    const x = interpolate(
      progress,
      [0, 1, 2],
      [width, 0, -width * 0.3],
      Extrapolation.CLAMP,
    );

    return {
      content: {
        style: {
          transform: [{ translateX: x }],
        },
      },
    };
  },
  transitionSpec: {
    open: Transition.Specs.DefaultSpec,
    close: Transition.Specs.DefaultSpec,
  },
  ...config,
});
