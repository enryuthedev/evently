import { Stack } from 'expo-router';

export default function CreateLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="occasion" />
      <Stack.Screen name="details" />
      <Stack.Screen name="poll" />
      <Stack.Screen name="design" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
