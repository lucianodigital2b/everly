import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation } from 'react-native';
import { Ingredient, INGREDIENT_RISK_CONFIG } from '../lib/mockData';

interface Props {
  ingredient: Ingredient;
}

const IngredientBadge: React.FC<Props> = ({ ingredient }) => {
  const [expanded, setExpanded] = useState(false);
  const config = INGREDIENT_RISK_CONFIG[ingredient.risk];

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={toggle} activeOpacity={0.8}>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: config.bg }]}>
          <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
        </View>
        <Text style={styles.name} numberOfLines={expanded ? undefined : 1}>
          {ingredient.name}
        </Text>
        <Text style={[styles.chevron, { color: config.color }]}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {expanded && (
        <Text style={styles.explanation}>{ingredient.explanation}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    minWidth: 72,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Poppins-SemiBold',
  },
  name: {
    flex: 1,
    fontSize: 13,
    color: '#1f2937',
    fontFamily: 'Poppins-Medium',
  },
  chevron: {
    fontSize: 10,
  },
  explanation: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },
});

export default IngredientBadge;
