import { useCallback, useState } from "react";
import { AppState, Image, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useReducedMotion } from "react-native-reanimated";

/**
 * The welcome animation: wedding tasks stick out of a list, slide right and
 * get checked off. Rendered with Remotion outside this repo
 * (C:\- apps\everly-remotion, `node render.mjs`), one clip per language
 * because the task names are in the video. The clip loops without a seam and
 * its background is the screen's warm white, so it has no visible edge.
 * The app is English-only for now; welcome-pt.mp4 is rendered for later.
 */
const CLIP = {
  video: require("../assets/video/welcome-en.mp4"),
  poster: require("../assets/video/welcome-en-poster.jpg"),
};

/**
 * The clips are 1080x940. The frame fills whatever height the welcome screen
 * leaves after the copy and the buttons, and the clip is contained in it, so
 * small phones or a larger text size shrink the animation, never clip the
 * copy. The clip's background matches the screen, so the letterbox is invisible.
 */
export function WelcomeAnimation() {
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);

  const player = useVideoPlayer(reduceMotion ? null : CLIP.video, (p) => {
    p.loop = true;
    p.muted = true;
    // Never pauses the music or podcast they are already listening to.
    p.audioMixingMode = "mixWithOthers";
  });

  // Plays only while focused, resumes after the app comes back, and a
  // released player throws on any call.
  useFocusEffect(
    useCallback(() => {
      const play = () => {
        try {
          player.play();
        } catch {}
      };
      play();
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") play();
      });
      return () => {
        sub.remove();
        try {
          player.pause();
        } catch {}
      };
    }, [player])
  );

  return (
    <View style={styles.frame}>
      {(!ready || reduceMotion) && (
        <Image source={CLIP.poster} style={StyleSheet.absoluteFill} resizeMode="contain" fadeDuration={0} />
      )}
      {!reduceMotion && (
        <VideoView
          player={player}
          style={[StyleSheet.absoluteFill, { opacity: ready ? 1 : 0 }]}
          contentFit="contain"
          nativeControls={false}
          allowsPictureInPicture={false}
          onFirstFrameRender={() => setReady(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
});
