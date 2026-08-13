import React, { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { Link, router } from 'expo-router'
import {
  Badge,
  Button,
  Card,
  ChipSelect,
  ErrorState,
  Field,
  H1,
  H2,
  LoadingState,
  Muted,
  PasswordField,
  Screen,
} from '../../src/components/ui'
import { colors } from '../../src/theme/colors'
import { ApiError } from '../../src/api/client'
import { fetchCountries, type CurriculumCountry } from '../../src/api/curriculum'
import { submitTeacherApplication, uploadApplicationDocument } from '../../src/api/teacherVerification'
import type { Degree, DigitalLiteracy, TeachingLevel } from '@shared/types'

const DEGREES: { id: Degree; label: string }[] = [
  { id: 'bacharel', label: 'Bacharelato' },
  { id: 'licenciatura', label: 'Licenciatura' },
  { id: 'mestrado', label: 'Mestrado' },
  { id: 'doutoramento', label: 'Doutoramento' },
  { id: 'outro', label: 'Outro' },
]

const TEACHING_LEVELS: { id: TeachingLevel; label: string }[] = [
  { id: 'primary', label: 'Primário' },
  { id: 'secondary', label: 'Secundário' },
  { id: 'tertiary', label: 'Superior' },
]

const DIGITAL_LITERACY: { id: DigitalLiteracy; label: string }[] = [
  { id: 'basico', label: 'Básico' },
  { id: 'intermedio', label: 'Intermédio' },
  { id: 'avancado', label: 'Avançado' },
]

// Espelha a lista fixa de disciplinas de src/pages/register-teacher.html — nomes
// exactos (não texto livre) para que "subjects" case com o resto do sistema
// (currículo, filtros de conteúdo) em vez de variações ortográficas por professor.
const SUBJECTS = [
  'Matemática', 'Física', 'Química', 'Biologia', 'Ciências Naturais',
  'Português', 'Literatura', 'História', 'Geografia', 'Filosofia',
  'Inglês', 'Francês',
  'Informática', 'Empreendedorismo', 'Educação Física', 'Artes Visuais',
  'Economia', 'Contabilidade',
]

interface DocState {
  storagePath?: string
  originalName?: string
  link: string
  uploading: boolean
}

function DocumentUploader({
  label,
  docType,
  state,
  setState,
}: {
  label: string
  docType: 'cv' | 'certificate'
  state: DocState
  setState: (s: DocState) => void
}) {
  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    })
    if (result.canceled || !result.assets?.[0]) return
    const file = result.assets[0]
    setState({ ...state, uploading: true })
    try {
      const res = await uploadApplicationDocument(docType, {
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType,
      })
      setState({ storagePath: res.storage_path, originalName: res.original_name, link: '', uploading: false })
    } catch (e) {
      setState({ ...state, uploading: false })
    }
  }

  return (
    <Card>
      <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 8 }}>{label}</Text>
      {state.storagePath ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Badge text="Carregado" tone="success" />
          <Muted>{state.originalName}</Muted>
        </View>
      ) : null}
      <Button
        title={state.uploading ? 'A carregar…' : state.storagePath ? 'Substituir ficheiro' : 'Carregar PDF/Word'}
        onPress={pickFile}
        loading={state.uploading}
        variant="outline"
      />
      <Text style={{ textAlign: 'center', color: colors.textFaint, marginVertical: 8, fontSize: 12 }}>ou</Text>
      <Field
        placeholder="Cola um link (Google Drive, Dropbox…)"
        autoCapitalize="none"
        value={state.link}
        onChangeText={(v) => setState({ ...state, link: v, storagePath: undefined, originalName: undefined })}
        style={{ marginBottom: 0 }}
      />
    </Card>
  )
}

function ConsentCheckbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <Pressable
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}
      onPress={onToggle}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          borderWidth: 1.5,
          borderColor: checked ? colors.navy950 : colors.border,
          backgroundColor: checked ? colors.navy950 : colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}
      >
        {checked ? <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text> : null}
      </View>
      <Text style={{ flex: 1, fontSize: 13, color: colors.textMuted }}>{label}</Text>
    </Pressable>
  )
}

export default function RegisterTeacherScreen() {
  const [countries, setCountries] = useState<CurriculumCountry[]>([])
  const [countriesLoading, setCountriesLoading] = useState(true)
  const [countriesError, setCountriesError] = useState('')

  // Dados pessoais
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('') // YYYY-MM-DD
  const [nationalId, setNationalId] = useState('')
  const [countryId, setCountryId] = useState<string>()
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')

  // Qualificações
  const [degree, setDegree] = useState<Degree>()
  const [degreeField, setDegreeField] = useState('')
  const [institution, setInstitution] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [hasTeachingCert, setHasTeachingCert] = useState<boolean>()
  const [teachingCertType, setTeachingCertType] = useState('')

  // Experiência
  const [yearsExperience, setYearsExperience] = useState('')
  const [currentSchool, setCurrentSchool] = useState('')
  const [teachingLevels, setTeachingLevels] = useState<TeachingLevel[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [subjectsOther, setSubjectsOther] = useState('')

  // Motivação e referências
  const [motivationLetter, setMotivationLetter] = useState('')
  const [ref1Name, setRef1Name] = useState('')
  const [ref1Phone, setRef1Phone] = useState('')
  const [ref1Role, setRef1Role] = useState('')
  const [ref2Name, setRef2Name] = useState('')
  const [ref2Phone, setRef2Phone] = useState('')

  // Competências digitais
  const [digitalLiteracy, setDigitalLiteracy] = useState<DigitalLiteracy>()
  const [hasComputer, setHasComputer] = useState<boolean>()
  const [hasInternet, setHasInternet] = useState<boolean>()

  // Credenciais
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Termos — apenas validados no cliente (não persistidos no schema do backend)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptAccuracy, setAcceptAccuracy] = useState(false)
  const [acceptVerification, setAcceptVerification] = useState(false)

  // Documentos
  const [cvDoc, setCvDoc] = useState<DocState>({ link: '', uploading: false })
  const [certDoc, setCertDoc] = useState<DocState>({ link: '', uploading: false })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const loadCountries = () => {
    setCountriesLoading(true)
    setCountriesError('')
    fetchCountries()
      .then(setCountries)
      .catch((e) => setCountriesError(e instanceof ApiError ? e.message : 'Não foi possível carregar a lista de países.'))
      .finally(() => setCountriesLoading(false))
  }

  useEffect(() => {
    loadCountries()
  }, [])

  function toggleTeachingLevel(level: TeachingLevel) {
    setTeachingLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]))
  }

  function toggleSubject(subject: string) {
    setSubjects((prev) => {
      if (prev.includes(subject)) return prev.filter((s) => s !== subject)
      if (prev.length >= 5) return prev
      return [...prev, subject]
    })
  }

  async function handleSubmit() {
    setError('')

    if (!fullName.trim() || fullName.trim().length < 5) return setError('Nome completo obrigatório (mín. 5 caracteres).')
    if (!email.trim()) return setError('Email obrigatório.')
    if (!phone.trim() || phone.trim().length < 9) return setError('Telefone obrigatório (mín. 9 dígitos).')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return setError('Data de nascimento inválida — usa o formato AAAA-MM-DD.')
    if (!nationalId.trim()) return setError('Número do BI/CC obrigatório.')
    if (!countryId) return setError('Selecciona o país.')
    if (!province.trim()) return setError('Província obrigatória.')
    if (!city.trim()) return setError('Cidade obrigatória.')
    if (!degree) return setError('Selecciona o grau académico.')
    if (!degreeField.trim()) return setError('Área de formação obrigatória.')
    if (!institution.trim()) return setError('Instituição obrigatória.')
    const gradYear = parseInt(graduationYear, 10)
    if (!gradYear || gradYear < 1960) return setError('Ano de conclusão inválido.')
    if (hasTeachingCert === undefined) return setError('Indica se tens certificado de habilitação para o ensino.')
    const yrsExp = parseInt(yearsExperience, 10)
    if (isNaN(yrsExp) || yrsExp < 0) return setError('Anos de experiência inválidos.')
    if (teachingLevels.length === 0) return setError('Selecciona pelo menos um nível de ensino.')
    if (subjects.length === 0) return setError('Selecciona pelo menos uma disciplina.')
    if (motivationLetter.trim().length < 200) return setError(`Carta de motivação deve ter pelo menos 200 caracteres (tens ${motivationLetter.trim().length}).`)
    if (motivationLetter.trim().length > 500) return setError('Carta de motivação deve ter no máximo 500 caracteres.')
    if (!ref1Name.trim() || !ref1Phone.trim() || !ref1Role.trim()) return setError('Preenche os dados da referência profissional.')
    if (!digitalLiteracy) return setError('Selecciona o teu nível de literacia digital.')
    if (hasComputer === undefined || hasInternet === undefined) return setError('Indica se tens computador e internet.')
    if (password.length < 8) return setError('Senha deve ter pelo menos 8 caracteres.')
    if (password !== confirmPassword) return setError('As senhas não coincidem.')
    if (!cvDoc.storagePath && !cvDoc.link.trim()) return setError('Currículo obrigatório — carrega um ficheiro ou cola um link.')
    if (!certDoc.storagePath && !certDoc.link.trim()) return setError('Certificado de habilitações obrigatório — carrega um ficheiro ou cola um link.')
    if (!acceptTerms || !acceptAccuracy || !acceptVerification) return setError('Deve aceitar todos os termos para continuar.')

    setLoading(true)
    try {
      await submitTeacherApplication({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        birth_date: birthDate,
        national_id: nationalId.trim(),
        country_id: countryId,
        province: province.trim(),
        city: city.trim(),
        degree,
        degree_field: degreeField.trim(),
        institution: institution.trim(),
        graduation_year: gradYear,
        has_teaching_cert: hasTeachingCert,
        teaching_cert_type: hasTeachingCert ? teachingCertType.trim() || undefined : undefined,
        years_experience: yrsExp,
        current_school: currentSchool.trim() || undefined,
        teaching_levels: teachingLevels,
        subjects,
        subjects_other: subjectsOther.trim() || undefined,
        motivation_letter: motivationLetter.trim(),
        reference_1_name: ref1Name.trim(),
        reference_1_phone: ref1Phone.trim(),
        reference_1_role: ref1Role.trim(),
        reference_2_name: ref2Name.trim() || undefined,
        reference_2_phone: ref2Phone.trim() || undefined,
        digital_literacy: digitalLiteracy,
        has_computer: hasComputer,
        has_internet: hasInternet,
        password,
        confirm_password: confirmPassword,
        cv_storage_path: cvDoc.storagePath,
        cv_original_name: cvDoc.originalName,
        cv_link: cvDoc.storagePath ? undefined : cvDoc.link.trim() || undefined,
        certificate_storage_path: certDoc.storagePath,
        certificate_original_name: certDoc.originalName,
        certificate_link: certDoc.storagePath ? undefined : certDoc.link.trim() || undefined,
      })
      setSuccess(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível enviar a candidatura. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Screen scroll={false} style={{ justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>✅</Text>
          <H1>Candidatura enviada!</H1>
          <Muted style={{ textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
            A nossa equipa vai analisar os teus dados e documentos. Vais receber um email quando a decisão estiver
            pronta — normalmente em poucos dias úteis.
          </Muted>
          <Button title="Voltar ao início" onPress={() => router.replace('/(auth)/login')} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={{ marginTop: 16, marginBottom: 24 }}>
        <H1>Candidatura de Professor</H1>
        <Muted>
          Todos os professores passam por uma verificação (KYT) antes de poderem publicar aulas. Preenche os dados
          abaixo com atenção.
        </Muted>
      </View>

      <H2>Dados pessoais</H2>
      <Field label="Nome completo" value={fullName} onChangeText={setFullName} />
      <Field label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Field label="Telefone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <Field label="Data de nascimento (AAAA-MM-DD)" placeholder="1990-05-20" value={birthDate} onChangeText={setBirthDate} />
      <Field label="Número do BI / Cartão de Cidadão" value={nationalId} onChangeText={setNationalId} />
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>País</Text>
      {countriesLoading ? (
        <LoadingState label="A carregar países…" />
      ) : countriesError ? (
        <ErrorState message={countriesError} onRetry={loadCountries} />
      ) : (
        <ChipSelect
          options={countries.map((c) => c.id)}
          value={countryId}
          onChange={setCountryId}
          labels={Object.fromEntries(countries.map((c) => [c.id, `${c.flag} ${c.name}`]))}
        />
      )}
      <View style={{ height: 12 }} />
      <Field label="Província" value={province} onChangeText={setProvince} />
      <Field label="Cidade" value={city} onChangeText={setCity} />

      <H2>Qualificações</H2>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Grau académico</Text>
      <ChipSelect options={DEGREES.map((d) => d.id)} value={degree} onChange={setDegree} labels={Object.fromEntries(DEGREES.map((d) => [d.id, d.label]))} />
      <View style={{ height: 12 }} />
      <Field label="Área de formação" placeholder="Ex: Matemática" value={degreeField} onChangeText={setDegreeField} />
      <Field label="Instituição" value={institution} onChangeText={setInstitution} />
      <Field label="Ano de conclusão" keyboardType="number-pad" value={graduationYear} onChangeText={setGraduationYear} />
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Tens certificado de habilitação para o ensino?</Text>
      <ChipSelect options={['sim', 'nao']} value={hasTeachingCert === undefined ? undefined : hasTeachingCert ? 'sim' : 'nao'} onChange={(v) => setHasTeachingCert(v === 'sim')} labels={{ sim: 'Sim', nao: 'Não' }} />
      {hasTeachingCert ? (
        <Field
          label="Tipo/Nome do certificado"
          placeholder="Ex: CFPEF, INIDE, Certificação UNESCO..."
          value={teachingCertType}
          onChangeText={setTeachingCertType}
          style={{ marginTop: 12 }}
        />
      ) : null}

      <View style={{ height: 20 }} />
      <H2>Experiência</H2>
      <Field label="Anos de experiência a leccionar" keyboardType="number-pad" value={yearsExperience} onChangeText={setYearsExperience} />
      <Field label="Escola actual (opcional)" value={currentSchool} onChangeText={setCurrentSchool} />
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Níveis de ensino</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {TEACHING_LEVELS.map((l) => (
          <Text
            key={l.id}
            onPress={() => toggleTeachingLevel(l.id)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: teachingLevels.includes(l.id) ? colors.navy950 : colors.surface,
              color: teachingLevels.includes(l.id) ? '#fff' : colors.text,
              fontWeight: '600',
              fontSize: 13,
              overflow: 'hidden',
            }}
          >
            {l.label}
          </Text>
        ))}
      </View>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>
        Disciplinas que lecciona ({subjects.length}/5)
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {SUBJECTS.map((s) => {
          const active = subjects.includes(s)
          return (
            <Text
              key={s}
              onPress={() => toggleSubject(s)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: active ? colors.navy950 : colors.surface,
                color: active ? '#fff' : colors.text,
                fontWeight: '600',
                fontSize: 12,
                overflow: 'hidden',
              }}
            >
              {s}
            </Text>
          )
        })}
      </View>
      <Field
        label="Outra disciplina não listada (opcional)"
        value={subjectsOther}
        onChangeText={setSubjectsOther}
      />

      <H2>Motivação e referências</H2>
      <Field
        label={`Carta de motivação (200–500 caracteres — tens ${motivationLetter.trim().length})`}
        multiline
        numberOfLines={5}
        style={{ minHeight: 100, textAlignVertical: 'top' }}
        value={motivationLetter}
        onChangeText={setMotivationLetter}
      />
      <Field label="Nome da referência profissional" value={ref1Name} onChangeText={setRef1Name} />
      <Field label="Telefone da referência" keyboardType="phone-pad" value={ref1Phone} onChangeText={setRef1Phone} />
      <Field label="Cargo/relação da referência" placeholder="Ex: Director da escola" value={ref1Role} onChangeText={setRef1Role} />
      <Field label="2ª referência — Nome (opcional, mas valorizado)" value={ref2Name} onChangeText={setRef2Name} />
      <Field label="2ª referência — Telefone (opcional)" keyboardType="phone-pad" value={ref2Phone} onChangeText={setRef2Phone} />

      <H2>Competências digitais</H2>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Literacia digital</Text>
      <ChipSelect
        options={DIGITAL_LITERACY.map((d) => d.id)}
        value={digitalLiteracy}
        onChange={setDigitalLiteracy}
        labels={Object.fromEntries(DIGITAL_LITERACY.map((d) => [d.id, d.label]))}
      />
      <View style={{ height: 12 }} />
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Tens computador?</Text>
      <ChipSelect options={['sim', 'nao']} value={hasComputer === undefined ? undefined : hasComputer ? 'sim' : 'nao'} onChange={(v) => setHasComputer(v === 'sim')} labels={{ sim: 'Sim', nao: 'Não' }} />
      <View style={{ height: 12 }} />
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Tens acesso à internet?</Text>
      <ChipSelect options={['sim', 'nao']} value={hasInternet === undefined ? undefined : hasInternet ? 'sim' : 'nao'} onChange={(v) => setHasInternet(v === 'sim')} labels={{ sim: 'Sim', nao: 'Não' }} />

      <View style={{ height: 20 }} />
      <H2>Documentos</H2>
      <DocumentUploader label="Currículo (CV)" docType="cv" state={cvDoc} setState={setCvDoc} />
      <DocumentUploader label="Certificado de habilitações" docType="certificate" state={certDoc} setState={setCertDoc} />

      <View style={{ height: 20 }} />
      <H2>Credenciais de acesso</H2>
      <PasswordField label="Senha" value={password} onChangeText={setPassword} />
      <PasswordField label="Confirmar senha" value={confirmPassword} onChangeText={setConfirmPassword} />

      <View style={{ height: 8 }} />
      <ConsentCheckbox
        checked={acceptTerms}
        onToggle={() => setAcceptTerms((v) => !v)}
        label="Aceito os Termos de Uso e a Política de Privacidade da VClass"
      />
      <ConsentCheckbox
        checked={acceptAccuracy}
        onToggle={() => setAcceptAccuracy((v) => !v)}
        label="Declaro que todas as informações fornecidas são verídicas e assumo responsabilidade pela sua veracidade"
      />
      <ConsentCheckbox
        checked={acceptVerification}
        onToggle={() => setAcceptVerification((v) => !v)}
        label="Autorizo a VClass a contactar as referências profissionais indicadas para efeitos de verificação"
      />

      {error ? <Text style={{ color: colors.danger, marginTop: 12, marginBottom: 12, fontSize: 13 }}>{error}</Text> : null}

      <Button title="Enviar candidatura" onPress={handleSubmit} loading={loading} />

      <View style={{ marginTop: 20, alignItems: 'center' }}>
        <Link href="/(auth)/login" style={{ color: colors.brand600, fontWeight: '600' }}>
          Já tens conta? Entra
        </Link>
      </View>
    </Screen>
  )
}
