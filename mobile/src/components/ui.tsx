import React, { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radius, FALLBACK_SUBJECT_COLOR } from '../theme/colors'

// ── Layout ───────────────────────────────────────────────────────────────────
export function Screen({
  children,
  scroll = true,
  style,
  refreshControl,
}: {
  children: React.ReactNode
  scroll?: boolean
  style?: ViewStyle
  refreshControl?: any
}) {
  if (!scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.screen, style]}>{children}</View>
      </SafeAreaView>
    )
  }
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={[styles.screen, style]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>
}

// ── Texto ────────────────────────────────────────────────────────────────────
export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>
}
export function H2({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h2}>{children}</Text>
}
export function Muted({ children, style, ...rest }: { children: React.ReactNode; style?: any } & TextProps) {
  return (
    <Text style={[styles.muted, style]} {...rest}>
      {children}
    </Text>
  )
}

// ── Botão ────────────────────────────────────────────────────────────────────
export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
}: {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  style?: ViewStyle
}) {
  const isDisabled = disabled || loading
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'outline' && styles.btnOutline,
        variant === 'danger' && styles.btnDanger,
        isDisabled && styles.btnDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.brand600 : '#fff'} />
      ) : (
        <Text
          style={[
            styles.btnText,
            variant === 'outline' && { color: colors.brand600 },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

// ── Input ────────────────────────────────────────────────────────────────────
export function Field({
  label,
  error,
  style,
  ...props
}: TextInputProps & { label?: string; error?: string; style?: ViewStyle }) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={[styles.input, focused && styles.inputFocused, !!error && styles.inputError]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
}

export function PasswordField(props: TextInputProps & { label?: string; error?: string }) {
  const [show, setShow] = useState(false)
  return (
    <View style={{ marginBottom: 14 }}>
      {props.label ? <Text style={styles.label}>{props.label}</Text> : null}
      <View style={{ position: 'relative', justifyContent: 'center' }}>
        <TextInput
          placeholderTextColor={colors.textFaint}
          secureTextEntry={!show}
          style={[styles.input, !!props.error && styles.inputError, { paddingRight: 64 }]}
          {...props}
        />
        <TouchableOpacity onPress={() => setShow((s) => !s)} style={styles.showBtn}>
          <Text style={{ color: colors.brand600, fontWeight: '600', fontSize: 13 }}>{show ? 'Ocultar' : 'Mostrar'}</Text>
        </TouchableOpacity>
      </View>
      {props.error ? <Text style={styles.errorText}>{props.error}</Text> : null}
    </View>
  )
}

// ── Selector simples (chips) ─────────────────────────────────────────────────
export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[]
  value: T | undefined
  onChange: (v: T) => void
  labels?: Record<string, string>
}) {
  return (
    <View style={[styles.row, { flexWrap: 'wrap', gap: 8 }]}>
      {options.map((opt) => {
        const active = opt === value
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{labels?.[opt] ?? opt}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// ── Estados ──────────────────────────────────────────────────────────────────
export function LoadingState({ label = 'A carregar…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.brand600} size="large" />
      <Muted style={{ marginTop: 8 }}>{label}</Muted>
    </View>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 32 }}>⚠️</Text>
      <Text style={[styles.muted, { textAlign: 'center', marginTop: 8, marginBottom: 12 }]}>{message}</Text>
      {onRetry ? <Button title="Tentar novamente" onPress={onRetry} variant="outline" /> : null}
    </View>
  )
}

export function EmptyState({ icon = '📭', title, subtitle }: { icon?: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 32 }}>{icon}</Text>
      <Text style={{ fontWeight: '700', color: colors.text, marginTop: 8 }}>{title}</Text>
      {subtitle ? <Muted style={{ textAlign: 'center', marginTop: 4 }}>{subtitle}</Muted> : null}
    </View>
  )
}

export function Badge({ text, tone = 'default' }: { text: string; tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) {
  const toneColor = {
    default: { bg: '#f1f5f9', fg: colors.textMuted },
    success: { bg: colors.brand50, fg: colors.brand700 },
    warning: { bg: '#fffbeb', fg: colors.warning },
    danger: { bg: '#fef2f2', fg: colors.danger },
    info: { bg: '#eff6ff', fg: colors.info },
  }[tone]
  return (
    <View style={[styles.badge, { backgroundColor: toneColor.bg }]}>
      <Text style={{ color: toneColor.fg, fontSize: 12, fontWeight: '700' }}>{text}</Text>
    </View>
  )
}

// Indicador colorido de disciplina/categoria (mesma cor vinda da BD que o
// web usa em browse.html/library.html) — círculo cheio com a inicial do nome.
export function SubjectDot({ color, label, size = 40 }: { color?: string; label?: string; size?: number }) {
  const c = color || FALLBACK_SUBJECT_COLOR
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.42 }}>
        {(label || '?').trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  )
}

export function ProgressBar({ percent, color = colors.brand600 }: { percent: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, percent))
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  h1: { fontSize: 24, fontWeight: '800', color: colors.navy950, marginBottom: 4 },
  h2: { fontSize: 18, fontWeight: '700', color: colors.navy950, marginBottom: 8 },
  muted: { color: colors.textMuted, fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputFocused: { borderColor: colors.brand600 },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 4 },
  showBtn: { position: 'absolute', right: 12 },
  btn: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: colors.brand600 },
  btnSecondary: { backgroundColor: colors.navy900 },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.brand600 },
  btnDanger: { backgroundColor: colors.danger },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.navy950, borderColor: colors.navy950 },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  progressTrack: { height: 8, borderRadius: radius.pill, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill },
})
