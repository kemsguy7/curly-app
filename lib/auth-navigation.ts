import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { Platform } from 'react-native';

type DecorateUrl = (url: string) => string;

/**
 * Completes Clerk `finalize` navigation for Expo Router (native + web).
 */
export function navigateAfterAuthSession(decorateUrl: DecorateUrl, path: Href = '/(tabs)') {
  const url = decorateUrl(path as string);
  if (Platform.OS === 'web' && url.startsWith('http')) {
    window.location.href = url;
    return;
  }
  router.replace(url as Href);
}
