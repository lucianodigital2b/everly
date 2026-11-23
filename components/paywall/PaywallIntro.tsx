import { Image, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors as Colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { PREMIUM_FEATURES } from '../../constants/premium';

const COUPLE = require('../../assets/images/paywall-couple.jpg');

type Props = {
  titleFirst: string;
  titleSecond: string;
  subtitle: string;
};

// What Premium unlocks lives in constants/premium.ts (also enforced there).
const FEATURES = PREMIUM_FEATURES;

export function PaywallIntro({ titleFirst, titleSecond, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Image
        source={COUPLE}
        style={styles.photo}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <Text style={styles.title}>
        {titleFirst}
        {'\n'}
        <Text style={styles.titleAccent}>{titleSecond}</Text>
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.features}>
        {FEATURES.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <View style={styles.featureCheck}>
              <Check size={14} color={Colors.textPrimary} strokeWidth={3} />
            </View>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 16,
  },
  // Edge to edge and up to the top of the screen: the paywall's content
  // padding (24) is cancelled, and the header buttons float over it.
  photo: {
    alignSelf: 'stretch',
    marginHorizontal: -24,
    aspectRatio: 3 / 4,
    marginBottom: 8,
  },
  title: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h1,
    lineHeight: 36,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  titleAccent: {
    color: Colors.accentDeep,
  },
  subtitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    letterSpacing: 0.4,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  features: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    lineHeight: 20,
    color: Colors.textPrimary,
  },
});
