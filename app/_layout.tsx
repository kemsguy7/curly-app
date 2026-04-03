import '@/global.css';
import { Stack } from 'expo-router';

/** Without this, `(auth)` sorts before `(tabs)` (same “group index” tier, shorter name wins). */
export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
