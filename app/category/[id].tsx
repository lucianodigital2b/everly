import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CATEGORIES, PRODUCTS } from '../../lib/mockData';
import { useHealthStore } from '../../zustand/health-store';
import ProductCard from '../../components/ProductCard';
import PaywallModal from '../../components/PaywallModal';

type SortOption = 'Popular' | 'Recently Added' | 'Health Score';
const SORT_OPTIONS: SortOption[] = ['Popular', 'Recently Added', 'Health Score'];

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isPremium } = useHealthStore();
  const [sortBy, setSortBy] = useState<SortOption>('Popular');
  const [paywallVisible, setPaywallVisible] = useState(false);

  const category = CATEGORIES.find((c) => c.id === id);
  const products = PRODUCTS.filter((p) => p.categoryId === id);

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'Health Score') return b.score - a.score;
    if (sortBy === 'Recently Added') return b.id.localeCompare(a.id);
    return 0; // Popular - keep original order
  });

  const handleSortPress = (option: SortOption) => {
    if (option === 'Health Score' && !isPremium) {
      setPaywallVisible(true);
      return;
    }
    setSortBy(option);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹  Back</Text>
        </TouchableOpacity>
      </View>

      {/* Category Header */}
      <View style={styles.header}>
        <Text style={styles.categoryIcon}>{category?.icon ?? '📦'}</Text>
        <View>
          <Text style={styles.categoryName}>{category?.name ?? 'Products'}</Text>
          <Text style={styles.productCount}>
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </Text>
        </View>
      </View>

      {/* Sort Options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortRow}
      >
        {SORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.sortChip, sortBy === option && styles.sortChipActive]}
            onPress={() => handleSortPress(option)}
          >
            <Text style={[styles.sortText, sortBy === option && styles.sortTextActive]}>
              {option}
              {option === 'Health Score' && !isPremium ? ' 🔒' : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {sortedProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptySubtitle}>
              We're adding more products to this category soon.
            </Text>
          </View>
        ) : (
          sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => router.push(`/product/${product.id}`)}
            />
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        title="Sort by Health Score"
        description="Upgrade to Premium to sort products by their health score and find the best options instantly."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9faf8' },

  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { paddingVertical: 4 },
  backBtnText: {
    fontSize: 16,
    color: '#10b981',
    fontFamily: 'Poppins-SemiBold',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryIcon: { fontSize: 40 },
  categoryName: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  productCount: {
    fontSize: 13,
    color: '#9ca3af',
    fontFamily: 'Poppins-Regular',
  },

  sortRow: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sortChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  sortText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#6b7280',
  },
  sortTextActive: {
    color: '#fff',
  },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 20 },

  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});
