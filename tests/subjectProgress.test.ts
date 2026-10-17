import { describe, it, expect } from 'vitest'
import { computeSubjectProgress, subjectForChapterSlug, type CurriculumSubject } from '../src/utils/subjectProgress'

const SUBJECTS: CurriculumSubject[] = [
  { id: 'mz10-mat', gradeId: 'mz-10c', name: 'Matemática', icon: 'fa-calculator', color: '#9333ea', displayOrder: 1 },
  { id: 'mz10-fis', gradeId: 'mz-10c', name: 'Física', icon: 'fa-atom', color: '#2563eb', displayOrder: 2 },
  { id: 'mz10-bio', gradeId: 'mz-10c', name: 'Biologia', icon: 'fa-dna', color: '#16a34a', displayOrder: 3 },
  { id: 'mz12-mat', gradeId: 'mz-12c', name: 'Matemática', icon: 'fa-calculator', color: '#9333ea', displayOrder: 1 }
]
const CHAPTERS = [
  { id: 'c-mat', slug: 'mz10-mat-1790415654' },
  { id: 'c-fis', slug: 'mz10-fis-1790415654-2' },
  { id: 'c-12', slug: 'mz12-mat-1790415654' },
  { id: 'c-old', slug: 'mz10mat-1-1' } // formato antigo: não liga a nenhuma disciplina
]
const LESSONS = [
  { id: 'm1', chapter_id: 'c-mat' }, { id: 'm2', chapter_id: 'c-mat' },
  { id: 'm3', chapter_id: 'c-mat' }, { id: 'm4', chapter_id: 'c-mat' },
  { id: 'f1', chapter_id: 'c-fis' }, { id: 'f2', chapter_id: 'c-fis' },
  { id: 't1', chapter_id: 'c-12' },
  { id: 'x1', chapter_id: 'c-old' }
]
const base = { gradeId: 'mz-10c', subjects: SUBJECTS, chapters: CHAPTERS, lessons: LESSONS, submissions: [] }

describe('subjectForChapterSlug', () => {
  it('liga o capítulo à disciplina pelo prefixo do slug', () => {
    expect(subjectForChapterSlug('mz10-fis-1790415654-2', SUBJECTS)?.id).toBe('mz10-fis')
    expect(subjectForChapterSlug('MZ10-MAT-1', SUBJECTS)?.id).toBe('mz10-mat')
  })
  it('ignora slugs vazios ou noutro formato', () => {
    expect(subjectForChapterSlug('', SUBJECTS)).toBeNull()
    expect(subjectForChapterSlug('mz10mat-1-1', SUBJECTS)).toBeNull()
  })
})

describe('computeSubjectProgress', () => {
  it('aluno novo vê todas as lições da sua classe a 0%', () => {
    const { subjects, summary } = computeSubjectProgress({ ...base, progress: [] })
    expect(subjects.map(s => [s.subject_name, s.completed_lessons, s.total_lessons, s.progress_percent])).toEqual([
      ['Matemática', 0, 4, 0],
      ['Física', 0, 2, 0]
    ])
    // Biologia não tem lições publicadas: não aparece
    expect(subjects.some(s => s.subject_id === 'mz10-bio')).toBe(false)
    expect(summary.total_lessons).toBe(6)
  })

  it('a percentagem sobe com lições vistas a meio, não só com as concluídas', () => {
    const { subjects } = computeSubjectProgress({
      ...base,
      progress: [
        { lesson_id: 'm1', status: 'completed', progress_percent: 100, time_spent: 600 },
        { lesson_id: 'm2', status: 'in_progress', progress_percent: 40, time_spent: 200 },
        { lesson_id: 'f1', status: 'in_progress', progress_percent: 30, time_spent: 100 }
      ]
    })
    const mat = subjects.find(s => s.subject_id === 'mz10-mat')!
    expect(mat.completed_lessons).toBe(1)
    expect(mat.total_lessons).toBe(4) // todas as lições, não só as abertas
    expect(mat.progress_percent).toBe(35) // (100 + 40 + 0 + 0) / 4
    expect(mat.total_watch_time).toBe(800)
    expect(subjects.find(s => s.subject_id === 'mz10-fis')!.progress_percent).toBe(15)
    expect(subjects[0].subject_id).toBe('mz10-mat') // mais avançada primeiro
  })

  it('progresso de outros alunos não conta (só as linhas passadas)', () => {
    const { subjects } = computeSubjectProgress({ ...base, progress: [] })
    expect(subjects.every(s => s.progress_percent === 0 && s.completed_lessons === 0)).toBe(true)
  })

  it('lição de outra classe aparece com o nome da classe', () => {
    const { subjects } = computeSubjectProgress({
      ...base,
      gradeNames: { 'mz-10c': '10ª Classe', 'mz-12c': '12ª Classe' },
      progress: [{ lesson_id: 't1', status: 'completed', progress_percent: 100, time_spent: 0 }]
    })
    const other = subjects.find(s => s.subject_id === 'mz12-mat')!
    expect(other.subject_name).toBe('Matemática · 12ª Classe')
    expect(other.progress_percent).toBe(100)
    expect(subjects.find(s => s.subject_id === 'mz10-mat')!.subject_name).toBe('Matemática')
  })

  it('aluno sem classe vê só as disciplinas em que já estudou', () => {
    const { subjects } = computeSubjectProgress({
      ...base,
      gradeId: null,
      progress: [{ lesson_id: 'f2', status: 'in_progress', progress_percent: 50, time_spent: 0 }]
    })
    expect(subjects.map(s => s.subject_id)).toEqual(['mz10-fis'])
  })

  it('resumo: concluídas, exercícios distintos, nota média e tempo', () => {
    const { summary, subjects } = computeSubjectProgress({
      ...base,
      progress: [
        { lesson_id: 'm1', status: 'completed', progress_percent: 100, time_spent: 300 },
        { lesson_id: 'f1', status: 'in_progress', progress_percent: 20, time_spent: 60 }
      ],
      submissions: [
        { exercise_id: 'e1', lesson_id: 'm1', is_correct: true },
        { exercise_id: 'e1', lesson_id: 'm1', is_correct: false },
        { exercise_id: 'e2', lesson_id: 'f1', is_correct: true },
        { exercise_id: 'e3', lesson_id: 'f1', is_correct: true }
      ]
    })
    expect(summary).toEqual({
      lessons_completed: 1,
      total_lessons: 6,
      exercises_completed: 3,
      avg_score: 75,
      total_time_spent_seconds: 360
    })
    expect(subjects.find(s => s.subject_id === 'mz10-mat')!.average_score).toBe(50)
    expect(subjects.find(s => s.subject_id === 'mz10-fis')!.average_score).toBe(100)
  })
})
