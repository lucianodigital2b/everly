import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, Plus } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { t } from '../i18n';

type Group = { id: string; name: string };

type Props = {
  groups: Group[];
  value: string;
  onChange: (groupId: string) => void;
  /** Creates a group and returns its id. Without it the sheet has no "new group" row. */
  onCreate?: (name: string) => string;
};

/**
 * The guest's group as one field that opens a sheet with every group in a
 * vertical list. Replaces a horizontal chip row that took a long swipe to
 * reach the group you wanted once a wedding had a dozen of them.
 *
 * Built on the RN Modal like SuccessSheet: no provider above it, and the form
 * underneath keeps its state.
 */
export function GroupPicker({ groups, value, onChange, onCreate }: Props) {
  const [open, setOpen] = React.useState(false);
  const current = groups.find((g) => g.id === value);

  return (
    <>
      {/* TouchableOpacity, not Pressable's function-form style: that form
          rendered unstyled in this app (see SuccessSheet). */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.field}
        onPress={() => {
          void Haptics.selectionAsync();
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={t('groupPicker.title')}
        accessibilityValue={{ text: current?.name ?? '' }}
      >
        <Text style={styles.fieldText} numberOfLines={1}>
          {current?.name ?? t('groupPicker.title')}
        </Text>
        <ChevronDown size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <GroupPickerSheet
        visible={open}
        groups={groups}
        value={value}
        onClose={() => setOpen(false)}
        onPick={(id) => {
          onChange(id);
          setOpen(false);
        }}
        onCreate={onCreate}
      />
    </>
  );
}

type SheetProps = {
  visible: boolean;
  groups: Group[];
  value: string;
  onClose: () => void;
  onPick: (groupId: string) => void;
  onCreate?: (name: string) => string;
};

function GroupPickerSheet({ visible, groups, value, onClose, onPick, onCreate }: SheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');

  React.useEffect(() => {
    if (!visible) {
      progress.value = 0;
      setCreating(false);
      setNewName('');
      return;
    }
    progress.value = withTiming(1, {
      duration: reducedMotion ? 0 : 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, reducedMotion]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 400 }],
  }));

  const pick = (id: string) => {
    void Haptics.selectionAsync();
    onPick(id);
  };

  const create = () => {
    const name = newName.trim();
    if (!name || !onCreate) return;
    pick(onCreate(name));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Reanimated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel={t('guestEdit.cancel')} />
        </Reanimated.View>

        <Reanimated.View
          style={[
            styles.sheet,
            { maxHeight: height * 0.8, paddingBottom: Math.max(insets.bottom, 16) + 8 },
            sheetStyle,
          ]}
        >
          <View style={styles.grabber} />
          <Text style={styles.title}>{t('groupPicker.title')}</Text>

          <ScrollView
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {groups.map((group) => {
              const selected = group.id === value;
              return (
                <TouchableOpacity
                  key={group.id}
                  activeOpacity={0.7}
                  style={[styles.row, selected && styles.rowSelected]}
                  onPress={() => pick(group.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[styles.rowText, selected && styles.rowTextSelected]}
                    numberOfLines={1}
                  >
                    {group.name}
                  </Text>
                  {selected ? (
                    <Check size={18} color={colors.accentDeep} strokeWidth={2.5} />
                  ) : null}
                </TouchableOpacity>
              );
            })}

            {onCreate ? (
              creating ? (
                <View style={styles.createRow}>
                  <TextInput
                    style={styles.createInput}
                    autoFocus
                    value={newName}
                    onChangeText={setNewName}
                    placeholder={t('guestEdit.groupNamePlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="done"
                    onSubmitEditing={create}
                  />
                  <Pressable
                    style={[styles.createSave, !newName.trim() && styles.disabled]}
                    disabled={!newName.trim()}
                    onPress={create}
                  >
                    <Text style={styles.createSaveText}>{t('guestEdit.save')}</Text>
                  </Pressable>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.row}
                  onPress={() => setCreating(true)}
                  accessibilityRole="button"
                >
                  <View style={styles.newGroup}>
                    <Plus size={18} color={colors.accentDeep} strokeWidth={2.2} />
                    <Text style={styles.newGroupText}>{t('groupPicker.newGroup')}</Text>
                  </View>
                </TouchableOpacity>
              )
            ) : null}
          </ScrollView>
        </Reanimated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldText: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: 'rgba(46,36,41,0.32)',
  },
  sheet: {
    backgroundColor: colors.backgroundSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 20,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  title: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  rowSelected: {
    backgroundColor: colors.surface2,
  },
  rowText: {
    flex: 1,
    fontFamily: typography.fonts.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  rowTextSelected: {
    fontFamily: typography.fonts.semibold,
    color: colors.accentDeep,
  },
  newGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newGroupText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 16,
    color: colors.accentDeep,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  createInput: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  createSave: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  createSaveText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  disabled: {
    opacity: 0.5,
  },
});
