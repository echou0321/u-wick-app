import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tabBarStyles as styles } from '@/src/styles/tabs';
import { Colors } from '@/constants/colors';
import CoachMarkWizard from '@/src/wizard/CoachMarkWizard';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.primaryLight,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tabs.Screen
          name="chat"
          options={{ title: 'Chat', tabBarIcon: tabIcon('chatbubble-outline') }}
        />
        <Tabs.Screen
          name="todo"
          options={{ title: 'TODO', tabBarIcon: tabIcon('checkmark-circle-outline') }}
        />
        <Tabs.Screen
          name="schedule"
          options={{ title: 'Schedule', tabBarIcon: tabIcon('calendar-outline') }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: 'Profile', tabBarIcon: tabIcon('person-outline') }}
        />
      </Tabs>
      <CoachMarkWizard />
    </View>
  );
}
