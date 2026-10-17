// Progresso do aluno por disciplina (dashboard e página Progresso).
//
// As disciplinas de cada classe vêm do currículo estático
// (src/data/curriculum.ts) e as lições reais da BD ligam-se a elas pelo slug
// do capítulo — `${subjectId}-<timestamp>`, a mesma regra de
// mergeDbChaptersIntoTree em routes/curriculum.ts. A antiga
// subject_progress_view não conhecia esta ligação e juntava as lições ao
// progresso de todos os alunos antes de filtrar pelo aluno: o total contava só
// as lições já abertas e a percentagem ficava a 0 até uma lição ser concluída.

export interface CurriculumSubject {
  id: string
  gradeId: string
  name: string
  icon: string
  color: string
  displayOrder: number
}

export interface ProgressRow {
  lesson_id: string
  status: string | null
  progress_percent: number | null
  time_spent: number | null
}

export interface SubmissionRow {
  exercise_id: string | null
  lesson_id: string | null
  is_correct: boolean | null
}

export interface SubjectProgress {
  subject_id: string
  subject_name: string
  subject_color: string
  icon: string
  total_lessons: number
  completed_lessons: number
  // Média do avanço em todas as lições da disciplina (concluída = 100, a meio =
  // a % vista), para a barra mexer à medida que o aluno vê vídeos.
  progress_percent: number
  total_watch_time: number
  average_score: number | null
}

export interface ProgressSummary {
  lessons_completed: number
  total_lessons: number
  exercises_completed: number
  avg_score: number
  total_time_spent_seconds: number
}

/** Disciplina estática a que pertence um capítulo da BD, pelo prefixo do slug. */
export function subjectForChapterSlug(slug: string | null | undefined, subjects: CurriculumSubject[]): CurriculumSubject | null {
  const s = String(slug || '').toLowerCase()
  if (!s) return null
  return subjects.find(sub => s.startsWith(sub.id.toLowerCase() + '-')) || null
}

export function computeSubjectProgress(input: {
  gradeId: string | null | undefined
  subjects: CurriculumSubject[]
  chapters: { id: string; slug: string | null }[]
  lessons: { id: string; chapter_id: string | null }[]
  progress: ProgressRow[]
  submissions: SubmissionRow[]
  // Nome curto das classes ("12ª Classe"…) para distinguir disciplinas de
  // outra classe com o mesmo nome (aluno da 11ª que viu uma lição da 12ª).
  gradeNames?: Record<string, string>
}): { subjects: SubjectProgress[]; summary: ProgressSummary } {
  const subjectByChapter = new Map<string, CurriculumSubject>()
  for (const ch of input.chapters) {
    const subject = subjectForChapterSlug(ch.slug, input.subjects)
    if (subject) subjectByChapter.set(ch.id, subject)
  }

  const subjectByLesson = new Map<string, CurriculumSubject>()
  const lessonsBySubject = new Map<string, string[]>()
  for (const l of input.lessons) {
    const subject = l.chapter_id ? subjectByChapter.get(l.chapter_id) : undefined
    if (!subject) continue
    subjectByLesson.set(l.id, subject)
    const list = lessonsBySubject.get(subject.id) || []
    list.push(l.id)
    lessonsBySubject.set(subject.id, list)
  }

  const progressByLesson = new Map(input.progress.map(p => [p.lesson_id, p]))

  // Disciplinas a mostrar: as da classe do aluno e as de outras classes em que
  // já estudou alguma lição — desde que tenham lições publicadas.
  const shown = new Map<string, CurriculumSubject>()
  for (const s of input.subjects) {
    if (input.gradeId && s.gradeId === input.gradeId) shown.set(s.id, s)
  }
  for (const p of input.progress) {
    const s = subjectByLesson.get(p.lesson_id)
    if (s) shown.set(s.id, s)
  }

  const scoreBySubject = new Map<string, { correct: number; total: number }>()
  for (const sub of input.submissions) {
    const s = sub.lesson_id ? subjectByLesson.get(sub.lesson_id) : undefined
    if (!s) continue
    const acc = scoreBySubject.get(s.id) || { correct: 0, total: 0 }
    acc.total++
    if (sub.is_correct) acc.correct++
    scoreBySubject.set(s.id, acc)
  }

  const subjects: (SubjectProgress & { _order: number })[] = []
  for (const s of shown.values()) {
    const lessonIds = lessonsBySubject.get(s.id) || []
    if (!lessonIds.length) continue
    let completed = 0, pctSum = 0, watch = 0
    for (const id of lessonIds) {
      const p = progressByLesson.get(id)
      if (!p) continue
      const done = p.status === 'completed'
      if (done) completed++
      pctSum += done ? 100 : Math.min(100, Math.max(0, p.progress_percent || 0))
      watch += p.time_spent || 0
    }
    const score = scoreBySubject.get(s.id)
    subjects.push({
      subject_id: s.id,
      subject_name: s.gradeId !== input.gradeId && input.gradeNames?.[s.gradeId]
        ? `${s.name} · ${input.gradeNames[s.gradeId]}`
        : s.name,
      subject_color: s.color,
      icon: s.icon,
      total_lessons: lessonIds.length,
      completed_lessons: completed,
      progress_percent: Math.round(pctSum / lessonIds.length),
      total_watch_time: watch,
      average_score: score ? Math.round((score.correct / score.total) * 100) : null,
      _order: s.displayOrder
    })
  }
  // Primeiro as disciplinas com mais avanço; depois a ordem do currículo.
  subjects.sort((a, b) => b.progress_percent - a.progress_percent || a._order - b._order)

  const submissionsTotal = input.submissions.length
  const submissionsCorrect = input.submissions.filter(s => s.is_correct).length
  const summary: ProgressSummary = {
    lessons_completed: input.progress.filter(p => p.status === 'completed').length,
    total_lessons: subjects.reduce((n, s) => n + s.total_lessons, 0),
    exercises_completed: new Set(input.submissions.map(s => s.exercise_id).filter(Boolean)).size,
    avg_score: submissionsTotal ? Math.round((submissionsCorrect / submissionsTotal) * 100) : 0,
    total_time_spent_seconds: input.progress.reduce((n, p) => n + (p.time_spent || 0), 0)
  }

  return { subjects: subjects.map(({ _order, ...s }) => s), summary }
}
