import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { colors } from '../../../src/theme/colors'

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
}

export default function TeacherTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.brand600,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: { borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Visão Geral', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }}
      />
      <Tabs.Screen
        name="content"
        options={{ title: 'Conteúdos', tabBarIcon: ({ focused }) => <TabIcon emoji="🎬" focused={focused} /> }}
      />
      <Tabs.Screen
        name="students"
        options={{ title: 'Alunos', tabBarIcon: ({ focused }) => <TabIcon emoji="🎓" focused={focused} /> }}
      />
      <Tabs.Screen
        name="earnings"
        options={{ title: 'Ganhos', tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} /> }}
      />
    </Tabs>
  )
}
