import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { notificationsStore } from '../zustand/notifications';
import { notificationsActions } from '../zustand/notifications/actions';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import * as Icons from 'react-native-heroicons/outline';

const { width } = Dimensions.get('window');

const GlobalNotifications = () => {
  const { colorScheme } = useNativewindColorScheme();
  const notifications = notificationsStore((state) => state.notifications);
  const dispatch = notificationsStore((state) => state.dispatch);
  const { notificationsHide } = notificationsActions(dispatch);
  
  const [animatedValues, setAnimatedValues] = useState({});

  useEffect(() => {
    // Initialize animated values for new notifications
    notifications.forEach(notification => {
      if (!animatedValues[notification.id]) {
        const slideAnim = new Animated.Value(-width);
        const opacityAnim = new Animated.Value(0);
        
        setAnimatedValues(prev => ({
          ...prev,
          [notification.id]: { slideAnim, opacityAnim }
        }));

        // Animate in
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        // Auto dismiss after 4 seconds
        setTimeout(() => {
          dismissNotification(notification.id);
        }, 4000);
      }
    });
  }, [notifications]);

  const dismissNotification = (id) => {
    const animations = animatedValues[id];
    if (animations) {
      Animated.parallel([
        Animated.timing(animations.slideAnim, {
          toValue: -width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animations.opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        notificationsHide(id);
        setAnimatedValues(prev => {
          const newValues = { ...prev };
          delete newValues[id];
          return newValues;
        });
      });
    } else {
      notificationsHide(id);
    }
  };

  const getNotificationStyle = (type) => {
    const baseStyle = {
      backgroundColor: colorScheme === 'dark' ? '#374151' : '#ffffff',
      borderLeftWidth: 4,
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyle,
          borderLeftColor: '#10b981',
        };
      case 'error':
        return {
          ...baseStyle,
          borderLeftColor: '#ef4444',
        };
      case 'warning':
        return {
          ...baseStyle,
          borderLeftColor: '#f59e0b',
        };
      case 'info':
      default:
        return {
          ...baseStyle,
          borderLeftColor: '#3b82f6',
        };
    }
  };

  const getIconForType = (type) => {
    const iconColor = colorScheme === 'dark' ? '#9ca3af' : '#6b7280';
    
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

  if (notifications.length === 0) {
    return null;
  }

  return (
    <View className="absolute top-12 left-4 right-4 z-50">
      {notifications.map((notification) => {
        const animations = animatedValues[notification.id];
        if (!animations) return null;

        return (
          <Animated.View
            key={notification.id}
            style={[
              {
                transform: [{ translateX: animations.slideAnim }],
                opacity: animations.opacityAnim,
                marginBottom: 8,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              },
              getNotificationStyle(notification.type),
            ]}
          >
            <TouchableOpacity
              onPress={() => dismissNotification(notification.id)}
              className="flex-row items-center p-4"
              activeOpacity={0.8}
            >
              <View className="mr-3">
                {getIconForType(notification.type)}
              </View>
              
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
                onPress={() => dismissNotification(notification.id)}
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
      })}
    </View>
  );
};

export default GlobalNotifications;