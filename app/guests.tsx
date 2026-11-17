import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SectionList,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  Download,
  MessageCircle,
  Printer,
  Search,
  Share as ShareIcon,
  UserPlus,
} from 'lucide-react-native';
import { BackButton } from '../components/BackButton';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { usePlannerStore } from '../zustand/planner';
import {
  printGuestList,
  shareGuestListCsv,
  shareGuestListPdf,
} from '../utils/guestExport';
import {
  guestListText,
  guestStats,
  MENU_OPTIONS,
  rsvpMessage,
  useGuestsStore,
  whatsappUrl,
  type Guest,
  type RsvpStatus,
} from '../zustand/guests';

const DEFAULT_GROUP_IDS = ['couple', 'family', 'friends', 'work'];

type ViewMode = 'groups' | 'rsvp' | 'menu';

type GuestSection = {
  id: string;
  name: string;
  data: Guest[];
};

const VIEW_OPTIONS: { id: ViewMode; label: string }[] = [
  { id: 'groups', label: 'Groups' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'menu', label: 'Menu' },
];

function statusLabel(status: RsvpStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const statusPillColors: Record<
  RsvpStatus,
  { backgroundColor: string; color: string }
> = {
  waiting: { backgroundColor: colors.surface2, color: colors.textSecondary },
  attending: {
    backgroundColor: 'rgba(127,168,140,0.14)',
    color: colors.success,
  },
  declined: {
    backgroundColor: 'rgba(208,138,131,0.14)',
    color: colors.error,
  },
};

export default function GuestsScreen() {
  const insets = useSafeAreaInsets();
  const guests = useGuestsStore((state) => state.guests);
  const groups = useGuestsStore((state) => state.groups);
  const removeGroup = useGuestsStore((state) => state.removeGroup);
  const renameGroup = useGuestsStore((state) => state.renameGroup);
  const cycleStatus = useGuestsStore((state) => state.cycleStatus);
  const partnerA = usePlannerStore((state) => state.partnerA);
  const partnerB = usePlannerStore((state) => state.partnerB);
  const weddingDate = usePlannerStore((state) => state.weddingDate);

  const [view, setView] = useState<ViewMode>('groups');
  const [filter, setFilter] = useState<'all' | RsvpStatus>('all');
  const [search, setSearch] = useState('');
  const [renameGroupId, setRenameGroupId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (partnerA.trim() && partnerB.trim()) {
      useGuestsStore
        .getState()
        .seedCoupleGroups(partnerA.trim(), partnerB.trim());
    }
  }, [partnerA, partnerB]);

  const coupleTitle =
    partnerA && partnerB ? `${partnerA} & ${partnerB}` : 'us';
  const stats = useMemo(() => guestStats(guests), [guests]);
  const nonCoupleGuests = useMemo(
    () => guests.filter((guest) => guest.coupleSlot === null),
    [guests],
  );
  const showCoupleOnlyFooter = guests.length > 0 && nonCoupleGuests.length === 0;

  const effectiveFilter = view === 'rsvp' ? 'all' : filter;

  const filteredGuests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return guests.filter((guest) => {
      if (effectiveFilter !== 'all' && guest.status !== effectiveFilter) {
        return false;
      }
      if (query && !guest.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [guests, effectiveFilter, search]);

  const sections = useMemo<GuestSection[]>(() => {
    if (view === 'groups') {
      return groups
        .map((group) => ({
          id: group.id,
          name: group.name,
          data: filteredGuests.filter((guest) => guest.groupId === group.id),
        }))
        .filter((section) => section.data.length > 0);
    }

    if (view === 'rsvp') {
      const order: RsvpStatus[] = ['attending', 'waiting', 'declined'];
      return order
        .map((status) => ({
          id: status,
          name: statusLabel(status),
          data: filteredGuests.filter((guest) => guest.status === status),
        }))
        .filter((section) => section.data.length > 0);
    }

    const menuSections: GuestSection[] = MENU_OPTIONS.map((option) => ({
      id: option.id,
      name: option.label,
      data: filteredGuests.filter((guest) => guest.menu === option.id),
    })).filter((section) => section.data.length > 0);

    menuSections.push({
      id: 'unset',
      name: 'Not chosen',
      data: filteredGuests.filter((guest) => guest.menu === 'unset'),
    });

    return menuSections.filter((section) => section.data.length > 0);
  }, [view, groups, filteredGuests]);

  const handleShare = async () => {
    await Share.share({
      message: guestListText(guests, groups, coupleTitle),
    });
  };

  const runExport = async (task: () => Promise<void>) => {
    try {
      await task();
    } catch (error) {
      console.log('Guest list export failed:', error);
      Alert.alert('Could not export', 'Please try again.');
    }
  };

  const handleDownload = () => {
    void Haptics.selectionAsync();
    Alert.alert('Download guest list', 'Choose a format.', [
      {
        text: 'PDF',
        onPress: () => runExport(() => shareGuestListPdf(guests, groups, coupleTitle)),
      },
      {
        text: 'Spreadsheet (CSV)',
        onPress: () => runExport(() => shareGuestListCsv(guests, groups)),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handlePrint = () => {
    void Haptics.selectionAsync();
    void runExport(() => printGuestList(guests, groups, coupleTitle));
  };

  const handleCycle = (id: string) => {
    void Haptics.selectionAsync();
    cycleStatus(id);
  };

  const handleGroupLongPress = (section: GuestSection) => {
    if (DEFAULT_GROUP_IDS.includes(section.id)) return;

    const handleDelete = () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      removeGroup(section.id);
    };

    Alert.alert(section.name, 'Rename or delete this group?', [
      {
        text: 'Rename',
        onPress: () => {
          setRenameGroupId(section.id);
          setRenameValue(section.name);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete group?', 'Guests will move to Friends.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: handleDelete },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && renameGroupId) {
      void Haptics.selectionAsync();
      renameGroup(renameGroupId, trimmed);
    }
    setRenameGroupId(null);
    setRenameValue('');
  };

  const statItems = [
    { label: 'Invited', value: stats.invited },
    { label: 'Attending', value: stats.attending },
    { label: 'Waiting', value: stats.waiting },
    { label: 'Declined', value: stats.declined },
  ];

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>
        {guests.length === 0 ? 'No guests yet' : 'No matches'}
      </Text>
      <Text style={styles.emptyText}>
        {guests.length === 0
          ? 'Add your first guest or paste a list.'
          : 'Try a different search or filter.'}
      </Text>
      {guests.length === 0 && (
        <View style={styles.emptyButtons}>
          <Pressable
            style={styles.emptyButton}
            onPress={() => router.push({ pathname: '/guest-edit' })}
          >
            <Text style={styles.emptyButtonText}>Add guest</Text>
          </Pressable>
          <Pressable
            style={[styles.emptyButton, styles.emptyButtonSecondary]}
            onPress={() => router.push('/guest-import')}
          >
            <Text style={styles.emptyButtonText}>Paste a list</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderCoupleOnlyFooter = () => (
    <View style={styles.emptyStateFooter}>
      <View style={styles.emptyButtons}>
        <Pressable
          style={styles.emptyButton}
          onPress={() => router.push({ pathname: '/guest-edit' })}
        >
          <Text style={styles.emptyButtonText}>Add guest</Text>
        </Pressable>
        <Pressable
          style={[styles.emptyButton, styles.emptyButtonSecondary]}
          onPress={() => router.push('/guest-import')}
        >
          <Text style={styles.emptyButtonText}>Paste a list</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <BackButton fallback="/(tabs)/plan" />
          <Text style={styles.title}>Guests</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerButton}
              onPress={() => router.push('/guest-import')}
              hitSlop={8}
            >
              <UserPlus size={20} color={colors.textPrimary} />
            </Pressable>
            <Pressable
              style={styles.headerButton}
              onPress={handleShare}
              hitSlop={8}
            >
              <ShareIcon size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }: { section: GuestSection }) => {
            if (view !== 'groups') {
              return (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {section.name} ({section.data.length})
                  </Text>
                </View>
              );
            }

            return (
              <Pressable
                style={styles.sectionHeader}
                onLongPress={() => handleGroupLongPress(section)}
                delayLongPress={300}
                disabled={DEFAULT_GROUP_IDS.includes(section.id)}
              >
                <Text style={styles.sectionTitle}>
                  {section.name} ({section.data.length})
                </Text>
              </Pressable>
            );
          }}
          renderItem={({ item }: { item: Guest }) => {
            const groupName =
              view !== 'groups'
                ? (groups.find((group) => group.id === item.groupId)?.name ??
                  '')
                : null;

            return (
              <View style={styles.guestRow}>
                <Pressable
                  style={styles.guestMain}
                  onPress={() =>
                    router.push({
                      pathname: '/guest-edit',
                      params: { id: item.id },
                    })
                  }
                >
                  <View style={styles.guestNameRow}>
                    <Text style={styles.guestName}>
                      {item.name}
                      {item.plusOne ? (
                        <Text style={styles.plusOneLabel}>  plus one</Text>
                      ) : null}
                    </Text>
                    {item.coupleSlot ? (
                      <View style={styles.coupleBadge}>
                        <Text style={styles.coupleBadgeText}>Couple</Text>
                      </View>
                    ) : null}
                  </View>
                  {groupName ? (
                    <Text style={styles.guestGroupLine}>{groupName}</Text>
                  ) : null}
                  {item.note ? (
                    <Text style={styles.guestNote} numberOfLines={1}>
                      {item.note}
                    </Text>
                  ) : null}
                </Pressable>
                {item.phone &&
                item.status === 'waiting' &&
                !item.coupleSlot ? (
                  <Pressable
                    style={styles.whatsappIcon}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      Linking.openURL(
                        whatsappUrl(
                          item.phone!,
                          rsvpMessage(item.name, coupleTitle, weddingDate),
                        ),
                      );
                    }}
                    hitSlop={4}
                  >
                    <MessageCircle size={18} color={colors.success} />
                  </Pressable>
                ) : null}
                <Pressable
                  style={[
                    styles.statusPill,
                    { backgroundColor: statusPillColors[item.status].backgroundColor },
                  ]}
                  onPress={() => handleCycle(item.id)}
                  hitSlop={6}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: statusPillColors[item.status].color },
                    ]}
                  >
                    {statusLabel(item.status)}
                  </Text>
                </Pressable>
              </View>
            );
          }}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.viewSwitcher}>
                {VIEW_OPTIONS.map((option) => {
                  const selected = view === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.viewSegment,
                        selected && styles.viewSegmentSelected,
                      ]}
                      onPress={() => setView(option.id)}
                    >
                      <Text
                        style={[
                          styles.viewSegmentText,
                          selected && styles.viewSegmentTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.statsRow}>
                {statItems.map((stat) => (
                  <View key={stat.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.ageStats}>
                {`${stats.adults} adults${
                  stats.children ? ` · ${stats.children} kids` : ''
                }${stats.babies ? ` · ${stats.babies} babies` : ''}`}
              </Text>

              {guests.length > 0 ? (
                <View style={styles.exportRow}>
                  <Pressable style={styles.exportButton} onPress={handleDownload}>
                    <Download size={16} color={colors.textPrimary} />
                    <Text style={styles.exportButtonText}>Download</Text>
                  </Pressable>
                  <View style={styles.exportDivider} />
                  <Pressable style={styles.exportButton} onPress={handlePrint}>
                    <Printer size={16} color={colors.textPrimary} />
                    <Text style={styles.exportButtonText}>Print</Text>
                  </Pressable>
                </View>
              ) : null}

              {view !== 'rsvp' && (
                <View style={styles.filtersRow}>
                  {(['All', 'Attending', 'Waiting', 'Declined'] as const).map(
                    (chip) => {
                      const chipValue =
                        chip === 'All'
                          ? 'all'
                          : (chip.toLowerCase() as RsvpStatus);
                      const selected = filter === chipValue;
                      return (
                        <Pressable
                          key={chip}
                          style={[
                            styles.filterChip,
                            selected && styles.filterChipSelected,
                          ]}
                          onPress={() => setFilter(chipValue)}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              selected && styles.filterChipTextSelected,
                            ]}
                          >
                            {chip}
                          </Text>
                        </Pressable>
                      );
                    },
                  )}
                </View>
              )}

              <View style={styles.searchBox}>
                <Search size={18} color={colors.textTertiary} />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search guests"
                  placeholderTextColor={colors.textTertiary}
                  autoCorrect={false}
                />
              </View>

              {view === 'groups' && renameGroupId ? (
                <View style={styles.renameInline}>
                  <TextInput
                    style={styles.renameInput}
                    autoFocus
                    value={renameValue}
                    onChangeText={setRenameValue}
                    placeholder="Group name"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <Pressable
                    style={styles.renameSave}
                    onPress={handleRenameSubmit}
                  >
                    <Text style={styles.renameSaveText}>Save</Text>
                  </Pressable>
                  <Pressable
                    style={styles.renameCancel}
                    onPress={() => {
                      setRenameGroupId(null);
                      setRenameValue('');
                    }}
                  >
                    <Text style={styles.renameCancelText}>Cancel</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={renderEmptyState()}
          ListFooterComponent={
            showCoupleOnlyFooter ? renderCoupleOnlyFooter() : null
          }
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 110 },
          ]}
        />

        <Pressable
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={() => router.push({ pathname: '/guest-edit' })}
        >
          <Text style={styles.fabText}>+ Add guest</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: colors.backgroundPrimary,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  listHeader: {
    gap: 16,
    marginBottom: 8,
  },
  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  viewSegment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewSegmentSelected: {
    backgroundColor: colors.accentDeep,
  },
  viewSegmentText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  viewSegmentTextSelected: {
    color: colors.white,
    fontFamily: typography.fonts.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  statValue: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h2,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  ageStats: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    alignSelf: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  exportDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  exportButtonText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.accentDeep,
    borderColor: colors.accentDeep,
  },
  filterChipText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  filterChipTextSelected: {
    color: colors.white,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    paddingVertical: 10,
  },
  renameInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  renameInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  renameSave: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  renameSaveText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
  },
  renameCancel: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  renameCancelText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  sectionHeader: {
    paddingTop: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    marginBottom: 10,
    padding: 16,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  guestMain: {
    flex: 1,
    paddingRight: 12,
  },
  guestNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  guestName: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  plusOneLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  coupleBadge: {
    backgroundColor: 'rgba(127,168,140,0.14)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  coupleBadgeText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.success,
  },
  guestGroupLine: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  guestNote: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  whatsappIcon: {
    marginRight: 8,
    backgroundColor: 'rgba(127,168,140,0.12)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    gap: 8,
  },
  emptyStateFooter: {
    paddingTop: 24,
    paddingBottom: 12,
  },
  emptyTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  emptyText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  emptyButton: {
    backgroundColor: colors.accent,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  emptyButtonSecondary: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.button,
    color: colors.textPrimary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    backgroundColor: colors.accent,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: colors.accentDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  fabText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.button,
    color: colors.textPrimary,
  },
});
