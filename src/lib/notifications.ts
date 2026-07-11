import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { registerPushToken, setMyTimezone } from './api';

let registering: Promise<void> | null = null;
let handlerSet = false;

/**
 * Requests notification permission and registers this device's Expo push
 * token + IANA timezone with the server. Called lazily after a player's
 * first Faceoff finish (not a cold-start prompt). No-op on web/simulator —
 * push tokens require a physical native device.
 *
 * expo-notifications is dynamically imported (not a top-level import) so its
 * web shim's module-level side effects never run during Expo Router's web
 * SSR pass, which evaluates every route module without calling into it.
 */
export async function ensurePushRegistered(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (registering) return registering;

  registering = (async () => {
    const [Device, Notifications] = await Promise.all([import('expo-device'), import('expo-notifications')]);
    if (!Device.isDevice) return;

    if (!handlerSet) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      handlerSet = true;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;

    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerPushToken(expoPushToken);
    await setMyTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  })();

  try {
    await registering;
  } finally {
    registering = null;
  }
}
