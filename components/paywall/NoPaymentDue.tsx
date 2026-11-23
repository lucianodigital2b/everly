import { StyleSheet, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { colors as Colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

type Props = {
  visible: boolean;
  label: string;
};

export function NoPaymentDue({ visible, label }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.row}>
      <ShieldCheck size={18} color={Colors.accent} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    lineHeight: 16,
    color: Colors.accentDeep,
    letterSpacing: 0.4,
  },
});
