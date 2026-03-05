import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Product, getScoreClassification } from '../lib/mockData';
import { useHealthStore } from '../zustand/health-store';

interface Props {
  product: Product;
  onPress: () => void;
  showScore?: boolean;
}

const ProductCard: React.FC<Props> = ({ product, onPress, showScore = true }) => {
  const isPremium = useHealthStore((s) => s.isPremium);
  const classification = getScoreClassification(product.score);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.brand} numberOfLines={1}>{product.brand}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.category}>{product.category}</Text>
      </View>

      {showScore && (
        <View style={[styles.scoreBadge, isPremium ? { backgroundColor: classification.bg } : styles.lockedBadge]}>
          {isPremium ? (
            <Text style={[styles.scoreText, { color: classification.color }]}>
              {product.score}
            </Text>
          ) : (
            <Text style={styles.lockedText}>?</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    marginHorizontal: 12,
  },
  brand: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'Poppins-Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Poppins-SemiBold',
    marginTop: 2,
  },
  category: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
  },
  scoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },
  lockedBadge: {
    backgroundColor: '#f3f4f6',
  },
  lockedText: {
    fontSize: 18,
    color: '#d1d5db',
    fontFamily: 'Poppins-Bold',
  },
});

export default ProductCard;
