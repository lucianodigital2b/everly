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
      console.log(index);
      
      if (index === -1) {
        // Sheet is closed, navigate back
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