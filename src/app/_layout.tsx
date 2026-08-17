import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>

      {/* Get Started / Splash */}
      <Stack.Screen name="index" />

      {/* Authentication */}
      <Stack.Screen name="signup" />
      <Stack.Screen name="login" />

      {/* Main App */}
      <Stack.Screen name="(tabs)" />

    </Stack>
  );
}