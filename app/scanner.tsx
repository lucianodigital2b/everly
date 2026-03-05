import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { PRODUCTS } from '../lib/mockData';

type ScanState = 'idle' | 'scanning' | 'found';

export default function ScannerScreen() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startScan = () => {
    setScanState('scanning');

    // Animate scan line
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Simulate barcode detection after 2 seconds
    timerRef.current = setTimeout(() => {
      setScanState('found');
      // Pick a random mock product
      const randomProduct = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      timerRef.current = setTimeout(() => {
        router.replace(`/product/${randomProduct.id}`);
      }, 600);
    }, 2000);
  };

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Back */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Scan Barcode</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.subtitle}>
          {scanState === 'idle'
            ? 'Point the camera at a barcode\nto analyze a product'
            : scanState === 'scanning'
            ? 'Scanning...'
            : '✓ Product Found!'}
        </Text>

        {/* Camera Viewfinder Mock */}
        <View style={styles.viewfinder}>
          {/* Corner brackets */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Camera placeholder */}
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraIcon}>
              {scanState === 'found' ? '✅' : '📷'}
            </Text>
          </View>

          {/* Scan Line */}
          {scanState === 'scanning' && (
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineTranslateY }] },
              ]}
            />
          )}
        </View>

        {/* Barcode hint */}
        <View style={styles.barcodeHint}>
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.barcodeLine,
                { height: i % 3 === 0 ? 40 : 28, opacity: scanState === 'scanning' ? 0.6 : 0.2 },
              ]}
            />
          ))}
        </View>

        {scanState === 'idle' && (
          <TouchableOpacity style={styles.scanBtn} onPress={startScan}>
            <Text style={styles.scanBtnText}>Start Scanning</Text>
          </TouchableOpacity>
        )}

        {scanState === 'scanning' && (
          <View style={styles.scanningIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.scanningText}>Looking for barcode...</Text>
          </View>
        )}

        <TouchableOpacity style={styles.manualBtn} onPress={() => router.back()}>
          <Text style={styles.manualBtnText}>Search manually instead</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0a' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backText: {
    fontSize: 22,
    color: '#fff',
  },
  topTitle: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
  },

  body: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },

  viewfinder: {
    width: 260,
    height: 260,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 24,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: { fontSize: 60 },

  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#10b981',
    zIndex: 10,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },

  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },

  barcodeHint: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginBottom: 32,
  },
  barcodeLine: {
    width: 4,
    backgroundColor: '#10b981',
    borderRadius: 1,
  },

  scanBtn: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  scanBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },

  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  scanningText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },

  manualBtn: {
    paddingVertical: 10,
  },
  manualBtnText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textDecorationLine: 'underline',
  },
});
