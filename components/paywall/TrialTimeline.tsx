import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LockOpen, Bell, Star } from 'lucide-react-native';
import { colors as Colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { t } from '../../i18n';

type Props = {
  trialDays: number;
  price: string;
  date: string;
};

export function TrialTimeline({ trialDays, price, date }: Props) {
  const steps = [
    {
      icon: LockOpen,
      title: t('trialTimeline.todayTitle'),
      body: t('trialTimeline.todayBody'),
      last: false,
      accent: false,
    },
    {
      icon: Bell,
      title:
        trialDays > 1
          ? t('trialTimeline.reminderTitleDay', { day: trialDays - 1 })
          : t('trialTimeline.reminderTitleTonight'),
      body: t('trialTimeline.reminderBody'),
      last: false,
      accent: false,
    },
    {
      icon: Star,
      title: t('trialTimeline.startTitle', { day: trialDays }),
      body: t('trialTimeline.startBody'),
      last: true,
      accent: true,
    },
  ];

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.rail}>
            {step.last ? (
              <LinearGradient
                colors={['rgba(199,126,141,0.9)', 'rgba(199,126,141,0)']}
                style={styles.tail}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            ) : (
              <View style={[styles.track, index === 0 && styles.trackFirst]} />
            )}
            <View style={[styles.node, step.last ? styles.nodeLast : styles.nodeFilled]}>
              <step.icon size={18} color={step.last ? Colors.accentDeep : Colors.white} strokeWidth={1.8} />
            </View>
          </View>
          <View style={[styles.textWrap, step.last && styles.textWrapLast]}>
            <Text
              style={[styles.title, step.accent && styles.titleAccent]}
              maxFontSizeMultiplier={1.2}
            >
              {step.title}
            </Text>
            <Text style={styles.body} maxFontSizeMultiplier={1.2}>
              {step.body}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// Compact so the timeline and both plan cards share one screen.
const NODE = 36;

const styles = StyleSheet.create({
  container: {
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  rail: {
    width: NODE,
    alignItems: 'center',
  },
  track: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface2,
  },
  trackFirst: {
    borderTopLeftRadius: NODE / 2,
    borderTopRightRadius: NODE / 2,
  },
  tail: {
    position: 'absolute',
    top: 0,
    bottom: -32,
    left: 0,
    right: 0,
    borderTopLeftRadius: NODE / 2,
    borderTopRightRadius: NODE / 2,
  },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeFilled: {
    backgroundColor: Colors.accent,
  },
  nodeLast: {
    backgroundColor: Colors.backgroundSecondary,
  },
  textWrap: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 12,
    gap: 2,
  },
  textWrapLast: {
    paddingBottom: 0,
  },
  title: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h3,
    lineHeight: 21,
    color: Colors.textPrimary,
  },
  titleAccent: {
    color: Colors.accentDeep,
  },
  body: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
});
