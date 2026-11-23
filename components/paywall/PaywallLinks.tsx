import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors as Colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { t } from '../../i18n';

type Props = {
  restoreLoading: boolean;
  onRestore: () => void;
};

function Link({
  label,
  onPress,
  loading,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={styles.link}
      hitSlop={8}
      accessibilityRole="link"
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.textSecondary} />
      ) : (
        <Text style={styles.linkText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function PaywallLinks({ restoreLoading, onRestore }: Props) {
  function openTerms() {
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  }

  function openPrivacy() {
    Linking.openURL('https://everly.koffeecode.com/privacy');
  }

  return (
    <View style={styles.links}>
      <Link label={t('paywallLinks.restore')} onPress={onRestore} loading={restoreLoading} />
      <Text style={styles.dot}>·</Text>
      <Link label={t('paywallLinks.terms')} onPress={openTerms} />
      <Text style={styles.dot}>·</Text>
      <Link label={t('paywallLinks.privacy')} onPress={openPrivacy} />
    </View>
  );
}

const styles = StyleSheet.create({
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  link: {
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  linkText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: Colors.textTertiary,
    textDecorationLine: 'underline',
  },
  dot: {
    color: Colors.textTertiary,
    fontSize: typography.sizes.caption,
  },
});
