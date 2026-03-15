import * as Updates from 'expo-updates';
import { Alert } from 'react-native';

/**
 * Check for available updates and prompt user to install
 * @param {boolean} showNoUpdateAlert - Whether to show alert when no update is available
 */
export const checkForUpdates = async (showNoUpdateAlert = false) => {
  try {
    if (__DEV__) {
      if (showNoUpdateAlert) {
        Alert.alert('Updates', 'Updates are not available in development mode.');
      }
      return;
    }

    const update = await Updates.checkForUpdateAsync();
    
    if (update.isAvailable) {
      Alert.alert(
        'Update Available',
        'A new version of the app is available. Would you like to update now?',
        [
          {
            text: 'Later',
            style: 'cancel'
          },
          {
            text: 'Update',
            onPress: async () => {
              try {
                await Updates.fetchUpdateAsync();
                Alert.alert(
                  'Update Downloaded',
                  'The update has been downloaded. The app will restart to apply the update.',
                  [
                    {
                      text: 'Restart Now',
                      onPress: () => Updates.reloadAsync()
                    }
                  ]
                );
              } catch (error) {
                console.error('Error downloading update:', error);
                Alert.alert('Update Error', 'Failed to download the update. Please try again later.');
              }
            }
          }
        ]
      );
    } else if (showNoUpdateAlert) {
      Alert.alert('No Updates', 'You are already using the latest version of the app.');
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
    if (showNoUpdateAlert) {
      Alert.alert('Update Error', 'Unable to check for updates. Please try again later.');
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