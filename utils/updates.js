import * as Updates from 'expo-updates';
import { Alert } from 'react-native';
import { t } from '../i18n';

/**
 * Check for available updates and prompt user to install
 * @param {boolean} showNoUpdateAlert - Whether to show alert when no update is available
 */
export const checkForUpdates = async (showNoUpdateAlert = false) => {
  try {
    if (__DEV__) {
      if (showNoUpdateAlert) {
        Alert.alert(t('updates.devTitle'), t('updates.devMessage'));
      }
      return;
    }

    const update = await Updates.checkForUpdateAsync();
    
    if (update.isAvailable) {
      Alert.alert(
        t('updates.updateAvailableTitle'),
        t('updates.updateAvailableMessage'),
        [
          {
            text: t('updates.later'),
            style: 'cancel'
          },
          {
            text: t('updates.update'),
            onPress: async () => {
              try {
                await Updates.fetchUpdateAsync();
                Alert.alert(
                  t('updates.downloadedTitle'),
                  t('updates.downloadedMessage'),
                  [
                    {
                      text: t('updates.restartNow'),
                      onPress: () => Updates.reloadAsync()
                    }
                  ]
                );
              } catch (error) {
                console.error('Error downloading update:', error);
                Alert.alert(t('updates.downloadErrorTitle'), t('updates.downloadErrorMessage'));
              }
            }
          }
        ]
      );
    } else if (showNoUpdateAlert) {
      Alert.alert(t('updates.noUpdatesTitle'), t('updates.noUpdatesMessage'));
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
    if (showNoUpdateAlert) {
      Alert.alert(t('updates.checkErrorTitle'), t('updates.checkErrorMessage'));
    }
  }
};

/**
 * Get current update information
 */
export const getCurrentUpdateInfo = async () => {
  try {
    if (__DEV__) {
      return {
        isEmbeddedLaunch: true,
        updateId: null,
        createdAt: null,
        runtimeVersion: null
      };
    }

    const update = await Updates.readCurrentUpdateAsync();
    return {
      isEmbeddedLaunch: update.isEmbeddedLaunch,
      updateId: update.updateId,
      createdAt: update.createdAt,
      runtimeVersion: update.runtimeVersion
    };
  } catch (error) {
    console.error('Error getting current update info:', error);
    return null;
  }
};