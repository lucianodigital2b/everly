import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { PRODUCTS, getScoreClassification } from '../../lib/mockData';
import { useHealthStore } from '../../zustand/health-store';
import HealthScoreCircle from '../../components/HealthScoreCircle';
import IngredientBadge from '../../components/IngredientBadge';
import PaywallModal from '../../components/PaywallModal';

const FREE_SAVE_LIMIT = 5;

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [paywallVisible, setPaywallVisible] = useState(false);

  const { isPremium, savedProducts, saveProduct, removeSavedProduct, isProductSaved } = useHealthStore();

  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.notFound}>Product not found.</Text>
      </SafeAreaView>
    );
  }

  const saved = isProductSaved(product.id);
  const classification = getScoreClassification(product.score);

  const handleSave = () => {
    if (saved) {
      removeSavedProduct(product.id);
      return;
    }
    if (!isPremium && savedProducts.length >= FREE_SAVE_LIMIT) {
      setPaywallVisible(true);
      return;
    }
    saveProduct(product);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹  Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{saved ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image Placeholder */}
        <View style={[styles.imageHero, { backgroundColor: classification.bg }]}>
          <Text style={styles.productEmoji}>
            {product.category === 'Dairy' ? '🥛' :
             product.category === 'Beverages' ? '🥤' :
             product.category === 'Cereals' ? '🌾' :
             product.category === 'Supplements' ? '💊' : '🍿'}
          </Text>
        </View>

        <View style={styles.content}>
          {/* Product Info */}
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          </View>

          {/* Health Score */}
          <View style={styles.scoreSection}>
            <Text style={styles.sectionLabel}>Health Score</Text>

            <View style={styles.scoreCard}>
              <HealthScoreCircle
                score={product.score}
                size={130}
                locked={!isPremium}
              />
              <View style={styles.scoreInfo}>
                {isPremium ? (
                  <>
                    <Text style={styles.scoreClassLabel}>Classification</Text>
                    <View style={[styles.classificationBadge, { backgroundColor: classification.bg }]}>
                      <Text style={[styles.classificationText, { color: classification.color }]}>
                        {classification.label}
                      </Text>
                    </View>
                    <Text style={styles.scoreDetail}>Based on ingredients, additives & nutrient profile</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.lockedTitle}>Score Locked</Text>
                    <Text style={styles.lockedSubtitle}>
                      Upgrade to see the full health score and analysis.
                    </Text>
                    <TouchableOpacity style={styles.unlockBtn} onPress={() => setPaywallVisible(true)}>
                      <Text style={styles.unlockBtnText}>Unlock Full Analysis</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Ingredients */}
          <Text style={styles.sectionLabel}>Ingredients</Text>
          {product.ingredients.map((ingredient, i) => (
            <IngredientBadge key={i} ingredient={ingredient} />
          ))}

          {/* AI Summary */}
          {isPremium && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>AI Summary</Text>
              <View style={styles.aiCard}>
                <Text style={styles.aiIcon}>🤖</Text>
                <Text style={styles.aiText}>{product.aiSummary}</Text>
              </View>
            </>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.bigSaveBtn, saved && styles.bigSaveBtnSaved]}
            onPress={handleSave}
          >
            <Text style={styles.bigSaveBtnText}>
              {saved ? '✓ Saved to My List' : '+ Save Product'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9faf8' },
  notFound: {
    textAlign: 'center',
    marginTop: 40,
    color: '#6b7280',
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { paddingVertical: 8 },
  backBtnText: {
    fontSize: 16,
    color: '#10b981',
    fontFamily: 'Poppins-SemiBold',
  },
  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  saveBtnText: { fontSize: 20 },

  imageHero: {
    marginHorizontal: 20,
    height: 200,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  productEmoji: { fontSize: 80 },

  content: { paddingHorizontal: 20 },

  brand: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Poppins-Regular',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 12,
  },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  categoryPill: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  categoryText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Poppins-Medium',
  },

  sectionLabel: {
    fontSize: 17,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },

  scoreSection: { marginBottom: 28 },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  scoreInfo: { flex: 1 },
  scoreClassLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'Poppins-Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  classificationBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  classificationText: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },
  scoreDetail: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },

  lockedTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginBottom: 6,
  },
  lockedSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
    marginBottom: 14,
  },
  unlockBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  unlockBtnText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
  },

  aiCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  aiIcon: { fontSize: 22 },
  aiText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
  },

  bigSaveBtn: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  bigSaveBtnSaved: {
    backgroundColor: '#10b981',
  },
  bigSaveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});
