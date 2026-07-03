import { PermissionsAndroid, Platform } from 'react-native';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

// Only Android 13+ (API 33) requires a runtime prompt for notifications; everywhere else
// notifications are permitted by default, and expo-notifications can't be used here since
// merely importing it throws in Expo Go on Android (push support was removed in SDK 53).
const NEEDS_RUNTIME_PERMISSION = Platform.OS === 'android' && Platform.Version >= 33;

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (!NEEDS_RUNTIME_PERMISSION) return 'granted';
  const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  return granted ? 'granted' : 'undetermined';
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!NEEDS_RUNTIME_PERMISSION) return 'granted';
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return 'denied';
  return 'undetermined';
}
