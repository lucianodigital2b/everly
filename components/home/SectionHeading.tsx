import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { PressableScale } from './PressableScale';

type Props = {
  title: string;
  subtitle?: string;
  rightText?: string;
  onRightPress?: () => void;
};

export function SectionHeading({ title, subtitle, rightText, onRightPress }: Props) {
  return (
    <View style={styles.heading}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightText && onRightPress ? (
        <PressableScale onPress={onRightPress} style={styles.rightLink} hitSlop={8}>
          <Text style={styles.rightText}>{rightText}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  rightLink: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.accentDeep,
  },
});
