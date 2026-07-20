import React, { useRef, useMemo, useCallback } from "react";
import { View, StyleSheet, Text, Touchable, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import  * as Icons  from "react-native-heroicons/outline";

export default function BottomSheetLayout() {
  const bottomSheetRef = useRef(null);
  const router = useRouter();

  const snapPoints = useMemo(() => ["50%", "90%"], []);

  const handleSheetChange = useCallback(
    (index) => {
      // Sheet fully closed → dismiss, but only if there's a screen to pop.
      if (index === -1 && router.canGoBack()) {
        router.back();
      }
    },
    [router]
  );

  return (
    <TouchableOpacity style={styles.container} onPress={() => bottomSheetRef.current?.close()} activeOpacity={1}>
      <BottomSheet
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        onChange={handleSheetChange}
        ref={bottomSheetRef}
      >
        <BottomSheetView>
          <View className="p-5">
            
            
          </View>
        </BottomSheetView>

        {/* <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack> */}
      </BottomSheet>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});