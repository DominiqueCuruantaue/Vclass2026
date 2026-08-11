import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../../src/context/AuthContext'
import { Button, Field, H2, PasswordField, Screen } from '../../../src/components/ui'
import { colors } from '../../../src/theme/colors'
import { updateProfile, changePassword } from '../../../src/api/auth'
import { ApiError } from '../../../src/api/client'

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState('')

  async function handleSaveProfile() {
    setProfileMsg('')
    if (fullName.trim().length < 2) return setProfileMsg('Nome deve ter pelo menos 2 caracteres.')
    setSavingProfile(true)
    try {
      await updateProfile({ full_name: fullName.trim(), phone: phone.trim() || undefined })
      await refreshUser()
      setProfileMsg('Perfil atualizado com sucesso.')
    } catch (e) {
      setProfileMsg(e instanceof ApiError ? e.message : 'Não foi possível guardar.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword() {
    setPasswordMsg('')
    if (!currentPassword || newPassword.length < 8) return setPasswordMsg('Preenche a senha atual e uma nova com pelo menos 8 caracteres.')
    setSavingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordMsg('Senha alterada com sucesso.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (e) {
      setPasswordMsg(e instanceof ApiError ? e.message : 'Não foi possível alterar a senha.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <Screen>
      <H2>Dados pessoais</H2>
      <Field label="Nome completo" value={fullName} onChangeText={setFullName} />
      <Field label="Telefone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      {profileMsg ? <Text style={{ color: colors.textMuted, marginBottom: 12, fontSize: 13 }}>{profileMsg}</Text> : null}
      <Button title="Guardar alterações" onPress={handleSaveProfile} loading={savingProfile} />

      <View style={{ height: 28 }} />
      <H2>Alterar senha</H2>
      <PasswordField label="Senha atual" value={currentPassword} onChangeText={setCurrentPassword} />
      <PasswordField label="Nova senha" value={newPassword} onChangeText={setNewPassword} />
      {passwordMsg ? <Text style={{ color: colors.textMuted, marginBottom: 12, fontSize: 13 }}>{passwordMsg}</Text> : null}
      <Button title="Alterar senha" onPress={handleChangePassword} loading={savingPassword} variant="secondary" />
    </Screen>
  )
}
