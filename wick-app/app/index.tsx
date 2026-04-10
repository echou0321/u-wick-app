import { Redirect } from 'expo-router';

// Always start at onboarding for the prototype.
// In production this would check AsyncStorage for a completed-onboarding flag.
export default function Index() {
  return <Redirect href="/(onboarding)" />;
}
