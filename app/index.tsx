import { Redirect } from 'expo-router';
import { useStore } from '@/lib/store/useStore';

export default function Index() {
  const onboardingComplete = useStore((s) => s.onboardingComplete);
  return <Redirect href={onboardingComplete ? '/(tabs)' : '/onboarding'} />;
}
