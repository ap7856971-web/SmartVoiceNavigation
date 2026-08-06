import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>

      {/* Splash Screen */}
      <Stack.Screen name="index" />

      {/* Login Screen */}
      <Stack.Screen name="login" />

      {/* Bottom Tabs */}
      <Stack.Screen name="(tabs)" />

    </Stack>
  );
}