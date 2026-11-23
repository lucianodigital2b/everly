import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors as Colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

type Props = {
  label: string | null;
  loading: boolean;
};

export function PriceLine({ label, loading }: Props) {
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={Colors.accent} />
      </View>
    );
  }

  if (!label) return null;

  return <Text style={styles.line}>{label}</Text>;
}

const styles = StyleSheet.create({
  loading: {
    minHeight: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    lineHeight: 20,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
