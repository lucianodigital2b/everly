import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Markdown from 'react-native-markdown-display';
import {
  ArrowUp,
  ArrowUpRight,
  CalendarCheck,
  CircleCheck,
  Mail,
  RotateCcw,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from 'lucide-react-native';
import { usePostHog } from 'posthog-react-native';
import { t, LANGUAGE } from '../i18n';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { chatApi, type ChatTurn } from '../services/api';
import { useAssistantContext } from '../hooks/useAssistantContext';
import { useAssistantStore, type AssistantMessage } from '../zustand/assistant';

// Matches the server's history window (ChatService::MAX_HISTORY).
const HISTORY = 12;

// Guideline 5.1.2(i): personal data may go to a third-party AI only after the
// user is told who receives it and agrees. Asked once, before the first message.
const AI_CONSENT_KEY = 'assistant_ai_consent_v1';

async function ensureAiConsent(): Promise<boolean> {
  try {
    if ((await AsyncStorage.getItem(AI_CONSENT_KEY)) === '1') return true;
  } catch {}
  return new Promise((resolve) => {
    Alert.alert(t('assistant.consentTitle'), t('assistant.consentBody'), [
      { text: t('assistant.consentDecline'), style: 'cancel', onPress: () => resolve(false) },
      {
        text: t('assistant.consentAccept'),
        onPress: () => {
          AsyncStorage.setItem(AI_CONSENT_KEY, '1').catch(() => {});
          resolve(true);
        },
      },
    ]);
  });
}

// Tapping one sends it as the question right away.
const SUGGESTIONS = [
  { key: 'thisWeek', Icon: CalendarCheck },
  { key: 'onTrack', Icon: CircleCheck },
  { key: 'budget', Icon: Wallet },
  { key: 'saveTheDate', Icon: Mail },
] as const;

/**
 * The wedding assistant, opened from the FAB on the Home and Plan tabs.
 *
 * Full-screen modal with the insets applied by hand (CLAUDE.md: absolutely
 * positioned chrome and fullScreenModal screens do not get SafeAreaView
 * padding reliably). Plain KeyboardAvoidingView instead of DailyHair's
 * gifted-chat + keyboard-controller, so the screen ships over the air with no
 * new native module.
 */
export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const context = useAssistantContext();
  const messages = useAssistantStore((s) => s.messages);
  const add = useAssistantStore((s) => s.add);
  const remove = useAssistantStore((s) => s.remove);
  const clear = useAssistantStore((s) => s.clear);

  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardOpen(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Newest first for the inverted list, with the typing bubble on top.
  const data = useMemo(() => {
    const list: (AssistantMessage | { id: 'typing' })[] = [...messages].reverse();
    if (loading) list.unshift({ id: 'typing' });
    return list;
  }, [messages, loading]);

  const request = useCallback(async () => {
    const history: ChatTurn[] = useAssistantStore
      .getState()
      .messages.filter((m) => !m.failed)
      .slice(-HISTORY)
      .map(({ role, content }) => ({ role, content }));

    setLoading(true);
    try {
      const { reply } = await chatApi.send(history, LANGUAGE, context);
      add({ role: 'assistant', content: reply });
      posthog?.capture('assistant_reply');
    } catch (error: any) {
      const status = error?.response?.status;
      add({
        role: 'assistant',
        content: status === 429 ? t('assistant.limit') : t('assistant.error'),
        failed: true,
      });
      posthog?.capture('assistant_reply_failed', { status: status ?? 'network' });
    } finally {
      setLoading(false);
    }
  }, [add, context, posthog]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || loading) return;
      if (!(await ensureAiConsent())) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      // A failed reply is dropped before asking again, so it is never history.
      useAssistantStore.getState().messages.filter((m) => m.failed).forEach((m) => remove(m.id));
      add({ role: 'user', content });
      setDraft('');
      posthog?.capture('assistant_message_sent', { length: content.length, turns: messages.length });
      request();
    },
    [add, loading, messages.length, posthog, remove, request],
  );

  const retry = useCallback(
    (id: string) => {
      if (loading) return;
      remove(id);
      request();
    },
    [loading, remove, request],
  );

  const renderItem = ({ item }: { item: AssistantMessage | { id: 'typing' } }) => {
    if (item.id === 'typing') {
      return (
        <View style={[styles.bubble, styles.assistantBubble, styles.typing]}>
          <ActivityIndicator size="small" color={colors.accentDeep} />
          <Text style={styles.typingText}>{t('assistant.thinking')}</Text>
        </View>
      );
    }
    const message = item as AssistantMessage;

    if (message.role === 'user') {
      return (
        <View style={[styles.bubble, styles.userBubble]}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      );
    }

    if (message.failed) {
      return (
        <View style={[styles.bubble, styles.assistantBubble]}>
          <Text style={styles.errorText}>{message.content}</Text>
          <Pressable
            onPress={() => retry(message.id)}
            style={styles.retry}
            hitSlop={8}
            accessibilityRole="button"
          >
            <RotateCcw size={14} color={colors.accentDeep} strokeWidth={2.4} />
            <Text style={styles.retryText}>{t('assistant.retry')}</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={[styles.bubble, styles.assistantBubble]}>
        <Markdown style={markdownStyles}>{message.content}</Markdown>
      </View>
    );
  };

  const empty = messages.length === 0 && !loading;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('assistant.close')}
        >
          <X size={22} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('assistant.title')}</Text>
        {messages.length > 0 ? (
          <Pressable
            onPress={clear}
            disabled={loading}
            style={styles.headerButton}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('assistant.clear')}
          >
            <Trash2 size={19} color={colors.textSecondary} strokeWidth={2} />
          </Pressable>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {empty ? (
          <View style={styles.welcome}>
            <View style={styles.welcomeIcon}>
              <Sparkles size={26} color={colors.accentDeep} strokeWidth={2} />
            </View>
            <Text style={styles.welcomeTitle}>{t('assistant.welcomeTitle')}</Text>
            <Text style={styles.welcomeSubtitle}>{t('assistant.welcomeSubtitle')}</Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map(({ key, Icon }) => (
                <SuggestionButton
                  key={key}
                  Icon={Icon}
                  label={t(`assistant.suggestions.${key}`)}
                  disabled={loading}
                  onPress={() => send(t(`assistant.suggestions.${key}`))}
                />
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            inverted
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}

        <View
          style={[
            styles.composerBar,
            { paddingBottom: keyboardOpen ? 10 : insets.bottom + 10 },
          ]}
        >
          <View style={styles.composer}>
            <TextInput
              ref={inputRef}
              value={draft}
              onChangeText={setDraft}
              placeholder={t('assistant.placeholder')}
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              multiline
              maxLength={2000}
            />
            <Pressable
              onPress={() => send(draft)}
              disabled={!draft.trim() || loading}
              style={[styles.send, (!draft.trim() || loading) && styles.sendDisabled]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={t('assistant.send')}
            >
              <ArrowUp size={18} color={colors.white} strokeWidth={2.6} />
            </Pressable>
          </View>
          <Text style={styles.disclaimer}>{t('assistant.disclaimer')}</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// NativeWind's Pressable drops function styles (`style={({ pressed }) => …}`),
// so the pressed look comes from state and the style is a plain array.
function SuggestionButton({
  Icon,
  label,
  disabled,
  onPress,
}: {
  Icon: (typeof SUGGESTIONS)[number]['Icon'];
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      style={[styles.chip, pressed && styles.chipPressed]}
      accessibilityRole="button"
    >
      <View style={styles.chipIcon}>
        <Icon size={18} color={colors.accentDeep} strokeWidth={2.2} />
      </View>
      <Text style={styles.chipText} numberOfLines={2}>
        {label}
      </Text>
      <ArrowUpRight size={18} color={colors.textTertiary} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundPrimary },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h3 + 2,
    color: colors.textPrimary,
  },
  list: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  bubble: {
    maxWidth: '86%',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundSecondary,
    borderBottomLeftRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  userText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
  errorText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  retryText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 14,
    color: colors.accentDeep,
  },
  welcome: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h2 + 2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  suggestions: {
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 12,
    paddingRight: 14,
    paddingVertical: 12,
    shadowColor: '#3A2E14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  chipPressed: { backgroundColor: colors.surface2, transform: [{ scale: 0.98 }] },
  chipIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    flex: 1,
    fontFamily: typography.fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  composerBar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: colors.backgroundPrimary,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 36,
    paddingTop: 8,
    paddingBottom: 8,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  send: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendDisabled: { opacity: 0.4 },
  disclaimer: {
    fontFamily: typography.fonts.regular,
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 6,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  paragraph: { marginTop: 0, marginBottom: 6 },
  strong: { fontFamily: typography.fonts.semibold, fontWeight: 'normal' },
  em: { fontStyle: 'italic' },
  bullet_list: { marginBottom: 6 },
  ordered_list: { marginBottom: 6 },
  list_item: { marginBottom: 2 },
  heading1: { fontFamily: typography.fonts.title, fontSize: 19, marginBottom: 6 },
  heading2: { fontFamily: typography.fonts.title, fontSize: 18, marginBottom: 6 },
  heading3: { fontFamily: typography.fonts.semibold, fontSize: 16, marginBottom: 4 },
  link: { color: colors.accentDeep, textDecorationLine: 'underline' },
});
