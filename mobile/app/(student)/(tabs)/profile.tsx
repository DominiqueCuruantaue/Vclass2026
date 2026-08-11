import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../../src/context/AuthContext'
import { Card, H1, Muted, Screen } from '../../../src/components/ui'
import { colors, radius } from '../../../src/theme/colors'

function MenuItem({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
        <Text style={{ fontSize: 18, marginRight: 12 }}>{icon}</Text>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: danger ? colors.danger : colors.text }}>{label}</Text>
        <Text style={{ color: colors.textFaint }}>›</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.replace('/(auth)/login')
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginVertical: 16 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: radius.pill,
            backgroundColor: colors.navy950,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: colors.brand500, fontWeight: '900', fontSize: 26 }}>
            {(user?.full_name || user?.name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <H1>{user?.full_name || user?.name}</H1>
        <Muted>{user?.email}</Muted>
      </View>

      <Card style={{ padding: 4 }}>
        <View style={{ paddingHorizontal: 12 }}>
          <MenuItem icon="✏️" label="Editar perfil" onPress={() => router.push('/(student)/profile/edit')} />
          <Divider />
          <MenuItem icon="💳" label="Plano e assinatura" onPress={() => router.push('/(student)/profile/plans')} />
          <Divider />
          <MenuItem icon="🏆" label="Conquistas" onPress={() => router.push('/(student)/achievements')} />
          <Divider />
          <MenuItem icon="🔔" label="Notificações" onPress={() => router.push('/(student)/notifications')} />
          <Divider />
          <MenuItem icon="❓" label="Ajuda e suporte" onPress={() => router.push('/(student)/help')} />
        </View>
      </Card>

      <Card style={{ padding: 4, marginTop: 12 }}>
        <View style={{ paddingHorizontal: 12 }}>
          <MenuItem icon="🚪" label="Terminar sessão" onPress={handleLogout} danger />
        </View>
      </Card>
    </Screen>
  )
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border }} />
}
