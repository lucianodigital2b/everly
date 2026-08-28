import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  Easing,
  LinearTransition,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';
import { notificationsStore } from '../zustand/notifications';
import { notificationsActions } from '../zustand/notifications/actions';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import * as Icons from 'react-native-heroicons/outline';

const { width } = Dimensions.get('window');

const EASE = Easing.bezier(0.23, 1, 0.32, 1);
const AUTO_DISMISS_MS = 4000;

// Entrance/exit live in worklets on the UI thread. The previous version created
// its Animated.Values inside an effect and stored them in state, so the toast
// rendered `null` on the first pass and then appeared already-positioned — a
// visible flash on every notification. A layout animation has the value from
// frame zero.
const slideIn = (reduced) => () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateX: reduced ? 0 : -width }] },
    animations: {
      opacity: withTiming(1, { duration: 260, easing: EASE }),
      transform: [{ translateX: withTiming(0, { duration: 300, easing: EASE }) }],
    },
  };
};

const slideOut = (reduced) => () => {
  'worklet';
  return {
    initialValues: { opacity: 1, transform: [{ translateX: 0 }] },
    animations: {
      opacity: withTiming(0, { duration: 200, easing: EASE }),
      transform: [
        { translateX: withTiming(reduced ? 0 : -width, { duration: 260, easing: EASE }) },
      ],
    },
  };
};

const getNotificationStyle = (type, colorScheme) => {
  const baseStyle = {
    backgroundColor: colorScheme === 'dark' ? '#374151' : '#ffffff',
    borderLeftWidth: 4,
  };

  switch (type) {
    case 'success':
      return { ...baseStyle, borderLeftColor: '#10b981' };
    case 'error':
      return { ...baseStyle, borderLeftColor: '#ef4444' };
    case 'warning':
      return { ...baseStyle, borderLeftColor: '#f59e0b' };
    case 'info':
    default:
      return { ...baseStyle, borderLeftColor: '#3b82f6' };
  }
};

const getIconForType = (type) => {
  switch (type) {
    case 'success':
      return <Icons.CheckCircleIcon size={20} color="#10b981" />;
    case 'error':
      return <Icons.XCircleIcon size={20} color="#ef4444" />;
    case 'warning':
      return <Icons.ExclamationTriangleIcon size={20} color="#f59e0b" />;
    case 'info':
    default:
      return <Icons.InformationCircleIcon size={20} color="#3b82f6" />;
  }
};

const NotificationItem = ({ notification, colorScheme, onDismiss }) => {
  const reduced = useReducedMotion();
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  // One timer per toast, cleared on unmount — the old version leaked a
  // setTimeout per render pass and could fire against an already-gone id.
  useEffect(() => {
    const id = setTimeout(() => dismissRef.current(notification.id), AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [notification.id]);

  return (
    <Animated.View
      entering={slideIn(reduced)}
      exiting={slideOut(reduced)}
      layout={LinearTransition.duration(220)}
      style={[
        {
          marginBottom: 8,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        },
        getNotificationStyle(notification.type, colorScheme),
      ]}
    >
      <TouchableOpacity
        onPress={() => onDismiss(notification.id)}
        className="flex-row items-center p-4"
        activeOpacity={0.8}
      >
        <View className="mr-3">{getIconForType(notification.type)}</View>

        <View className="flex-1">
          {notification.title && (
            <Text
              className="font-psemibold text-sm mb-1"
              style={{ color: colorScheme === 'dark' ? '#f9fafb' : '#111827' }}
            >
              {notification.title}
            </Text>
          )}
          <Text
            className="font-pregular text-sm"
            style={{ color: colorScheme === 'dark' ? '#d1d5db' : '#374151' }}
          >
            {notification.message}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onDismiss(notification.id)}
          className="ml-2 p-1"
        >
          <Icons.XMarkIcon
            size={16}
            color={colorScheme === 'dark' ? '#9ca3af' : '#6b7280'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const GlobalNotifications = () => {
  const { colorScheme } = useNativewindColorScheme();
  const notifications = notificationsStore((state) => state.notifications);
  const dispatch = notificationsStore((state) => state.dispatch);
  const { notificationsHide } = notificationsActions(dispatch);

  // Removing the toast from the store is the whole dismissal: the `exiting`
  // worklet plays the slide-out after React has already unmounted it, so there
  // is no animation callback racing the state update.
  const dismiss = (id) => notificationsHide(id);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <View className="absolute top-12 left-4 right-4 z-50">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          colorScheme={colorScheme}
          onDismiss={dismiss}
        />
      ))}
    </View>
  );
};

export default GlobalNotifications;
