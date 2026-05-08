import { Stack } from 'expo-router';

export default function ProfileStackLayout() {
  // Ensures /edit, /courses, /major-goals, etc. render inside the Profile tab stack
  // instead of becoming separate bottom-tab items.
  return <Stack screenOptions={{ headerShown: false }} />;
}

