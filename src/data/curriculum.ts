// ============================================================
//  VClass — Currículos Escolares por País
//  Cobre: Moçambique, Angola, Brasil, Portugal, Cabo Verde
// ============================================================

export interface Country {
  id: string; code: string; name: string; flag: string; currency: string;
  educationTerms: 'trimestres' | 'semestres' | 'bimestres';
  termCount: number;
  is_active: boolean;
}

export interface EducationLevel {
  id: string; countryId: string; name: string; shortName: string;
  description: string; ageRange: string; displayOrder: number;
}

export interface Grade {
  id: string; levelId: string; name: string; shortName: string;
  displayOrder: number;
}

export interface Subject {
  id: string; gradeId: string; name: string; shortName: string;
  icon: string; color: string; description: string; displayOrder: number;
}

export interface Chapter {
  id: string; subjectId: string; title: string; description: string;
  term: number; displayOrder: number;
}

// ============================================================
//  PAÍSES
// ============================================================
export const COUNTRIES: Country[] = [
  { id: 'mz', code: 'MZ', name: 'Moçambique', flag: '🇲🇿', currency: 'MZN', educationTerms: 'trimestres', termCount: 3, is_active: true },
  { id: 'ao', code: 'AO', name: 'Angola',      flag: '🇦🇴', currency: 'AOA', educationTerms: 'trimestres', termCount: 3, is_active: true },
  { id: 'br', code: 'BR', name: 'Brasil',      flag: '🇧🇷', currency: 'BRL', educationTerms: 'bimestres',  termCount: 4, is_active: true },
  { id: 'pt', code: 'PT', name: 'Portugal',    flag: '🇵🇹', currency: 'EUR', educationTerms: 'trimestres', termCount: 3, is_active: true },
  { id: 'cv', code: 'CV', name: 'Cabo Verde',  flag: '🇨🇻', currency: 'CVE', educationTerms: 'trimestres', termCount: 3, is_active: true },
];

// ============================================================
//  NÍVEIS DE ENSINO
// ============================================================
export const EDUCATION_LEVELS: EducationLevel[] = [
  // ── MOÇAMBIQUE ─────────────────────────────────────────────
  { id: 'mz-ep1',  countryId: 'mz', name: 'Ensino Primário — 1º Grau',       shortName: 'EP1',  description: '1ª a 5ª Classe',          ageRange: '6–11',  displayOrder: 1 },
  { id: 'mz-ep2',  countryId: 'mz', name: 'Ensino Primário — 2º Grau',       shortName: 'EP2',  description: '6ª a 7ª Classe',          ageRange: '12–13', displayOrder: 2 },
  { id: 'mz-es1',  countryId: 'mz', name: 'Ensino Secundário — 1º Ciclo',    shortName: 'ESG1', description: '8ª a 10ª Classe',         ageRange: '14–16', displayOrder: 3 },
  { id: 'mz-es2',  countryId: 'mz', name: 'Ensino Secundário — 2º Ciclo',    shortName: 'ESG2', description: '11ª a 12ª Classe',        ageRange: '17–18', displayOrder: 4 },
  { id: 'mz-tec',  countryId: 'mz', name: 'Ensino Técnico-Profissional',      shortName: 'ETP',  description: 'Básico, Médio e Superior', ageRange: '15+',   displayOrder: 5 },

  // ── ANGOLA ─────────────────────────────────────────────────
  { id: 'ao-ep',   countryId: 'ao', name: 'Ensino Primário',                  shortName: 'EP',   description: '1ª a 6ª Classe',          ageRange: '6–12',  displayOrder: 1 },
  { id: 'ao-es1',  countryId: 'ao', name: 'Ensino Secundário I Ciclo',        shortName: 'ES1',  description: '7ª a 9ª Classe',          ageRange: '13–15', displayOrder: 2 },
  { id: 'ao-es2',  countryId: 'ao', name: 'Ensino Secundário II Ciclo',       shortName: 'ES2',  description: '10ª a 12ª Classe',        ageRange: '16–18', displayOrder: 3 },
  { id: 'ao-tec',  countryId: 'ao', name: 'Ensino Técnico-Profissional',      shortName: 'ETP',  description: 'Formação profissional',    ageRange: '15+',   displayOrder: 4 },

  // ── BRASIL ─────────────────────────────────────────────────
  { id: 'br-ef1',  countryId: 'br', name: 'Ensino Fundamental I',             shortName: 'EF1',  description: '1º ao 5º ano',            ageRange: '6–10',  displayOrder: 1 },
  { id: 'br-ef2',  countryId: 'br', name: 'Ensino Fundamental II',            shortName: 'EF2',  description: '6º ao 9º ano',            ageRange: '11–14', displayOrder: 2 },
  { id: 'br-em',   countryId: 'br', name: 'Ensino Médio',                     shortName: 'EM',   description: '1º ao 3º ano do EM',      ageRange: '15–17', displayOrder: 3 },
  { id: 'br-eja',  countryId: 'br', name: 'Educação de Jovens e Adultos',     shortName: 'EJA',  description: 'EJA Fundamental e Médio', ageRange: '18+',   displayOrder: 4 },

  // ── PORTUGAL ───────────────────────────────────────────────
  { id: 'pt-eb1',  countryId: 'pt', name: '1º Ciclo do Ensino Básico',        shortName: '1EB',  description: '1º ao 4º ano',            ageRange: '6–9',   displayOrder: 1 },
  { id: 'pt-eb2',  countryId: 'pt', name: '2º Ciclo do Ensino Básico',        shortName: '2EB',  description: '5º e 6º ano',             ageRange: '10–11', displayOrder: 2 },
  { id: 'pt-eb3',  countryId: 'pt', name: '3º Ciclo do Ensino Básico',        shortName: '3EB',  description: '7º ao 9º ano',            ageRange: '12–15', displayOrder: 3 },
  { id: 'pt-sec',  countryId: 'pt', name: 'Ensino Secundário',                shortName: 'ES',   description: '10º ao 12º ano',          ageRange: '15–18', displayOrder: 4 },
  { id: 'pt-pro',  countryId: 'pt', name: 'Cursos Profissionais',             shortName: 'CP',   description: 'Nível 4 de qualificação',  ageRange: '15+',   displayOrder: 5 },

  // ── CABO VERDE ─────────────────────────────────────────────
  { id: 'cv-eb',   countryId: 'cv', name: 'Ensino Básico',                    shortName: 'EB',   description: '1º ao 6º ano',            ageRange: '6–12',  displayOrder: 1 },
  { id: 'cv-es1',  countryId: 'cv', name: 'Ensino Secundário I Ciclo',        shortName: 'ES1',  description: '7º ao 9º ano',            ageRange: '13–15', displayOrder: 2 },
  { id: 'cv-es2',  countryId: 'cv', name: 'Ensino Secundário II Ciclo',       shortName: 'ES2',  description: '10º ao 12º ano',          ageRange: '16–18', displayOrder: 3 },
];

// ============================================================
//  ANOS / CLASSES
// ============================================================
export const GRADES: Grade[] = [
  // ── MOÇAMBIQUE EP1 ─────────────────────────────────────────
  { id: 'mz-1c', levelId: 'mz-ep1', name: '1ª Classe', shortName: '1C', displayOrder: 1 },
  { id: 'mz-2c', levelId: 'mz-ep1', name: '2ª Classe', shortName: '2C', displayOrder: 2 },
  { id: 'mz-3c', levelId: 'mz-ep1', name: '3ª Classe', shortName: '3C', displayOrder: 3 },
  { id: 'mz-4c', levelId: 'mz-ep1', name: '4ª Classe', shortName: '4C', displayOrder: 4 },
  { id: 'mz-5c', levelId: 'mz-ep1', name: '5ª Classe', shortName: '5C', displayOrder: 5 },
  // ── MOÇAMBIQUE EP2 ─────────────────────────────────────────
  { id: 'mz-6c', levelId: 'mz-ep2', name: '6ª Classe', shortName: '6C', displayOrder: 1 },
  { id: 'mz-7c', levelId: 'mz-ep2', name: '7ª Classe', shortName: '7C', displayOrder: 2 },
  // ── MOÇAMBIQUE ESG1 ────────────────────────────────────────
  { id: 'mz-8c',  levelId: 'mz-es1', name: '8ª Classe',  shortName: '8C',  displayOrder: 1 },
  { id: 'mz-9c',  levelId: 'mz-es1', name: '9ª Classe',  shortName: '9C',  displayOrder: 2 },
  { id: 'mz-10c', levelId: 'mz-es1', name: '10ª Classe', shortName: '10C', displayOrder: 3 },
  // ── MOÇAMBIQUE ESG2 ────────────────────────────────────────
  { id: 'mz-11c', levelId: 'mz-es2', name: '11ª Classe', shortName: '11C', displayOrder: 1 },
  { id: 'mz-12c', levelId: 'mz-es2', name: '12ª Classe', shortName: '12C', displayOrder: 2 },

  // ── ANGOLA ES1 ─────────────────────────────────────────────
  { id: 'ao-7c',  levelId: 'ao-es1', name: '7ª Classe',  shortName: '7C',  displayOrder: 1 },
  { id: 'ao-8c',  levelId: 'ao-es1', name: '8ª Classe',  shortName: '8C',  displayOrder: 2 },
  { id: 'ao-9c',  levelId: 'ao-es1', name: '9ª Classe',  shortName: '9C',  displayOrder: 3 },
  // ── ANGOLA ES2 ─────────────────────────────────────────────
  { id: 'ao-10c', levelId: 'ao-es2', name: '10ª Classe', shortName: '10C', displayOrder: 1 },
  { id: 'ao-11c', levelId: 'ao-es2', name: '11ª Classe', shortName: '11C', displayOrder: 2 },
  { id: 'ao-12c', levelId: 'ao-es2', name: '12ª Classe', shortName: '12C', displayOrder: 3 },

  // ── BRASIL EF2 ─────────────────────────────────────────────
  { id: 'br-6a',  levelId: 'br-ef2', name: '6º Ano EF',  shortName: '6A',  displayOrder: 1 },
  { id: 'br-7a',  levelId: 'br-ef2', name: '7º Ano EF',  shortName: '7A',  displayOrder: 2 },
  { id: 'br-8a',  levelId: 'br-ef2', name: '8º Ano EF',  shortName: '8A',  displayOrder: 3 },
  { id: 'br-9a',  levelId: 'br-ef2', name: '9º Ano EF',  shortName: '9A',  displayOrder: 4 },
  // ── BRASIL EM ──────────────────────────────────────────────
  { id: 'br-1em', levelId: 'br-em',  name: '1º Ano EM',  shortName: '1EM', displayOrder: 1 },
  { id: 'br-2em', levelId: 'br-em',  name: '2º Ano EM',  shortName: '2EM', displayOrder: 2 },
  { id: 'br-3em', levelId: 'br-em',  name: '3º Ano EM',  shortName: '3EM', displayOrder: 3 },

  // ── PORTUGAL 3EB ───────────────────────────────────────────
  { id: 'pt-7a',  levelId: 'pt-eb3', name: '7º Ano',  shortName: '7A',  displayOrder: 1 },
  { id: 'pt-8a',  levelId: 'pt-eb3', name: '8º Ano',  shortName: '8A',  displayOrder: 2 },
  { id: 'pt-9a',  levelId: 'pt-eb3', name: '9º Ano',  shortName: '9A',  displayOrder: 3 },
  // ── PORTUGAL SEC ───────────────────────────────────────────
  { id: 'pt-10a', levelId: 'pt-sec', name: '10º Ano', shortName: '10A', displayOrder: 1 },
  { id: 'pt-11a', levelId: 'pt-sec', name: '11º Ano', shortName: '11A', displayOrder: 2 },
  { id: 'pt-12a', levelId: 'pt-sec', name: '12º Ano', shortName: '12A', displayOrder: 3 },

  // ── CABO VERDE ES2 ─────────────────────────────────────────
  { id: 'cv-10a', levelId: 'cv-es2', name: '10º Ano', shortName: '10A', displayOrder: 1 },
  { id: 'cv-11a', levelId: 'cv-es2', name: '11º Ano', shortName: '11A', displayOrder: 2 },
  { id: 'cv-12a', levelId: 'cv-es2', name: '12º Ano', shortName: '12A', displayOrder: 3 },
];

// ============================================================
//  DISCIPLINAS E CAPÍTULOS
// ============================================================
export const SUBJECTS: Subject[] = [
  // ══ MOÇAMBIQUE 10ª Classe ══
  { id: 'mz10-mat',  gradeId: 'mz-10c', name: 'Matemática',        shortName: 'MAT', icon: 'fa-calculator', color: '#9333ea', description: 'Álgebra, Geometria Analítica e Trigonometria',     displayOrder: 1 },
  { id: 'mz10-port', gradeId: 'mz-10c', name: 'Português',         shortName: 'PORT',icon: 'fa-book-open',  color: '#3b82f6', description: 'Gramática, Literatura e Produção de Texto',        displayOrder: 2 },
  { id: 'mz10-fis',  gradeId: 'mz-10c', name: 'Física',            shortName: 'FIS', icon: 'fa-atom',       color: '#10b981', description: 'Mecânica, Termodinâmica e Electricidade',           displayOrder: 3 },
  { id: 'mz10-qui',  gradeId: 'mz-10c', name: 'Química',           shortName: 'QUI', icon: 'fa-flask',      color: '#f59e0b', description: 'Química Geral, Inorgânica e Orgânica',              displayOrder: 4 },
  { id: 'mz10-bio',  gradeId: 'mz-10c', name: 'Biologia',          shortName: 'BIO', icon: 'fa-leaf',       color: '#22c55e', description: 'Citologia, Genética e Ecologia',                   displayOrder: 5 },
  { id: 'mz10-geo',  gradeId: 'mz-10c', name: 'Geografia',         shortName: 'GEO', icon: 'fa-globe-africa',color:'#0ea5e9', description: 'Geografia Física e Humana de Moçambique e Mundo',  displayOrder: 6 },
  { id: 'mz10-his',  gradeId: 'mz-10c', name: 'História',          shortName: 'HIS', icon: 'fa-landmark',   color: '#dc2626', description: 'História de Moçambique e Universal',               displayOrder: 7 },
  { id: 'mz10-ing',  gradeId: 'mz-10c', name: 'Inglês',            shortName: 'ING', icon: 'fa-language',   color: '#7c3aed', description: 'Língua Inglesa — Comunicação e Gramática',         displayOrder: 8 },
  { id: 'mz10-edm',  gradeId: 'mz-10c', name: 'Ed. Moral e Cívica',shortName: 'EMC', icon: 'fa-handshake',  color: '#64748b', description: 'Valores cívicos e cidadania',                       displayOrder: 9 },

  // ══ MOÇAMBIQUE 11ª Classe ══
  { id: 'mz11-mat',  gradeId: 'mz-11c', name: 'Matemática',        shortName: 'MAT', icon: 'fa-calculator', color: '#9333ea', description: 'Cálculo diferencial, Integrais e Álgebra',         displayOrder: 1 },
  { id: 'mz11-port', gradeId: 'mz-11c', name: 'Português',         shortName: 'PORT',icon: 'fa-book-open',  color: '#3b82f6', description: 'Literatura Moçambicana e Portuguesa',              displayOrder: 2 },
  { id: 'mz11-fis',  gradeId: 'mz-11c', name: 'Física',            shortName: 'FIS', icon: 'fa-atom',       color: '#10b981', description: 'Óptica, Electromagnetismo e Física Moderna',        displayOrder: 3 },
  { id: 'mz11-qui',  gradeId: 'mz-11c', name: 'Química',           shortName: 'QUI', icon: 'fa-flask',      color: '#f59e0b', description: 'Electroquímica e Química Orgânica Avançada',       displayOrder: 4 },
  { id: 'mz11-bio',  gradeId: 'mz-11c', name: 'Biologia',          shortName: 'BIO', icon: 'fa-leaf',       color: '#22c55e', description: 'Anatomia, Fisiologia e Biotecnologia',              displayOrder: 5 },
  { id: 'mz11-geo',  gradeId: 'mz-11c', name: 'Geografia',         shortName: 'GEO', icon: 'fa-globe-africa',color:'#0ea5e9', description: 'Geopolítica, Recursos Naturais e Desenvolvimento', displayOrder: 6 },
  { id: 'mz11-his',  gradeId: 'mz-11c', name: 'História',          shortName: 'HIS', icon: 'fa-landmark',   color: '#dc2626', description: 'História Contemporânea e Relações Internacionais',  displayOrder: 7 },
  { id: 'mz11-ing',  gradeId: 'mz-11c', name: 'Inglês',            shortName: 'ING', icon: 'fa-language',   color: '#7c3aed', description: 'Inglês Intermediário-Avançado',                    displayOrder: 8 },

  // ══ MOÇAMBIQUE 12ª Classe ══
  { id: 'mz12-mat',  gradeId: 'mz-12c', name: 'Matemática',        shortName: 'MAT', icon: 'fa-calculator', color: '#9333ea', description: 'Cálculo Integral, Probabilidades e Estatística',  displayOrder: 1 },
  { id: 'mz12-port', gradeId: 'mz-12c', name: 'Português',         shortName: 'PORT',icon: 'fa-book-open',  color: '#3b82f6', description: 'Produção Textual, Análise Literária',              displayOrder: 2 },
  { id: 'mz12-fis',  gradeId: 'mz-12c', name: 'Física',            shortName: 'FIS', icon: 'fa-atom',       color: '#10b981', description: 'Física Atómica e Nuclear',                         displayOrder: 3 },
  { id: 'mz12-qui',  gradeId: 'mz-12c', name: 'Química',           shortName: 'QUI', icon: 'fa-flask',      color: '#f59e0b', description: 'Química Industrial e Ambiental',                   displayOrder: 4 },
  { id: 'mz12-bio',  gradeId: 'mz-12c', name: 'Biologia',          shortName: 'BIO', icon: 'fa-leaf',       color: '#22c55e', description: 'Microbiologia, Imunologia e Saúde',                displayOrder: 5 },

  // ══ ANGOLA 7ª Classe (ES1) ══
  { id: 'ao7-mat',  gradeId: 'ao-7c', name: 'Matemática',        shortName: 'MAT', icon: 'fa-calculator',  color: '#9333ea', description: 'Números inteiros, frações e geometria plana',         displayOrder: 1 },
  { id: 'ao7-port', gradeId: 'ao-7c', name: 'Língua Portuguesa', shortName: 'PORT',icon: 'fa-book-open',   color: '#3b82f6', description: 'Comunicação oral, escrita e literatura',              displayOrder: 2 },
  { id: 'ao7-fis',  gradeId: 'ao-7c', name: 'Ciências Físicas',  shortName: 'CF',  icon: 'fa-atom',        color: '#10b981', description: 'Noções de física e química básica',                   displayOrder: 3 },
  { id: 'ao7-nat',  gradeId: 'ao-7c', name: 'Ciências Naturais', shortName: 'CN',  icon: 'fa-leaf',        color: '#22c55e', description: 'Seres vivos, ecossistemas e saúde',                   displayOrder: 4 },
  { id: 'ao7-his',  gradeId: 'ao-7c', name: 'História',          shortName: 'HIS', icon: 'fa-landmark',    color: '#dc2626', description: 'Pré-história e civilizações antigas',                 displayOrder: 5 },
  { id: 'ao7-geo',  gradeId: 'ao-7c', name: 'Geografia',         shortName: 'GEO', icon: 'fa-globe-africa',color: '#0ea5e9', description: 'Cartografia, relevo e clima de Angola',               displayOrder: 6 },
  { id: 'ao7-ing',  gradeId: 'ao-7c', name: 'Língua Inglesa',    shortName: 'ING', icon: 'fa-language',    color: '#7c3aed', description: 'Inglês básico — vocabulário e gramática',              displayOrder: 7 },

  // ══ ANGOLA 8ª Classe (ES1) ══
  { id: 'ao8-mat',  gradeId: 'ao-8c', name: 'Matemática',        shortName: 'MAT', icon: 'fa-calculator',  color: '#9333ea', description: 'Álgebra, equações e geometria',                        displayOrder: 1 },
  { id: 'ao8-port', gradeId: 'ao-8c', name: 'Língua Portuguesa', shortName: 'PORT',icon: 'fa-book-open',   color: '#3b82f6', description: 'Textos, gramática e produção escrita',                 displayOrder: 2 },
  { id: 'ao8-fis',  gradeId: 'ao-8c', name: 'Ciências Físicas',  shortName: 'CF',  icon: 'fa-atom',        color: '#10b981', description: 'Energia, calor e movimentos',                          displayOrder: 3 },
  { id: 'ao8-nat',  gradeId: 'ao-8c', name: 'Ciências Naturais', shortName: 'CN',  icon: 'fa-leaf',        color: '#22c55e', description: 'Célula, genética básica e reprodução',                 displayOrder: 4 },
  { id: 'ao8-his',  gradeId: 'ao-8c', name: 'História',          shortName: 'HIS', icon: 'fa-landmark',    color: '#dc2626', description: 'Idade Média e expansão ultramarina',                   displayOrder: 5 },
  { id: 'ao8-geo',  gradeId: 'ao-8c', name: 'Geografia',         shortName: 'GEO', icon: 'fa-globe-africa',color: '#0ea5e9', description: 'Hidrografia, clima e população angolana',              displayOrder: 6 },
  { id: 'ao8-ing',  gradeId: 'ao-8c', name: 'Língua Inglesa',    shortName: 'ING', icon: 'fa-language',    color: '#7c3aed', description: 'Inglês elementar — leitura e expressão',               displayOrder: 7 },

  // ══ ANGOLA 9ª Classe (ES1) ══
  { id: 'ao9-mat',  gradeId: 'ao-9c', name: 'Matemática',        shortName: 'MAT', icon: 'fa-calculator',  color: '#9333ea', description: 'Funções, trigonometria básica e estatística',          displayOrder: 1 },
  { id: 'ao9-port', gradeId: 'ao-9c', name: 'Língua Portuguesa', shortName: 'PORT',icon: 'fa-book-open',   color: '#3b82f6', description: 'Literatura angolana e análise textual',                 displayOrder: 2 },
  { id: 'ao9-fis',  gradeId: 'ao-9c', name: 'Ciências Físicas',  shortName: 'CF',  icon: 'fa-atom',        color: '#10b981', description: 'Electricidade, magnetismo e óptica básica',             displayOrder: 3 },
  { id: 'ao9-nat',  gradeId: 'ao-9c', name: 'Ciências Naturais', shortName: 'CN',  icon: 'fa-leaf',        color: '#22c55e', description: 'Ecologia, saúde e corpo humano',                        displayOrder: 4 },
  { id: 'ao9-his',  gradeId: 'ao-9c', name: 'História',          shortName: 'HIS', icon: 'fa-landmark',    color: '#dc2626', description: 'Angola colonial e processo de independência',           displayOrder: 5 },
  { id: 'ao9-geo',  gradeId: 'ao-9c', name: 'Geografia',         shortName: 'GEO', icon: 'fa-globe-africa',color: '#0ea5e9', description: 'Globalização, recursos e desenvolvimento de Angola',    displayOrder: 6 },
  { id: 'ao9-ing',  gradeId: 'ao-9c', name: 'Língua Inglesa',    shortName: 'ING', icon: 'fa-language',    color: '#7c3aed', description: 'Inglês pré-intermédio — gramática e conversação',       displayOrder: 7 },

  // ══ ANGOLA 10ª Classe ══
  { id: 'ao10-mat',  gradeId: 'ao-10c', name: 'Matemática',        shortName: 'MAT', icon: 'fa-calculator', color: '#9333ea', description: 'Funções, Trigonometria e Geometria',               displayOrder: 1 },
  { id: 'ao10-port', gradeId: 'ao-10c', name: 'Língua Portuguesa', shortName: 'PORT',icon: 'fa-book-open',  color: '#3b82f6', description: 'Gramática, Texto e Literatura Angolana',           displayOrder: 2 },
  { id: 'ao10-fis',  gradeId: 'ao-10c', name: 'Física',            shortName: 'FIS', icon: 'fa-atom',       color: '#10b981', description: 'Mecânica, Termodinâmica e Ondas',                  displayOrder: 3 },
  { id: 'ao10-qui',  gradeId: 'ao-10c', name: 'Química',           shortName: 'QUI', icon: 'fa-flask',      color: '#f59e0b', description: 'Química Geral e Inorgânica',                       displayOrder: 4 },
  { id: 'ao10-bio',  gradeId: 'ao-10c', name: 'Biologia',          shortName: 'BIO', icon: 'fa-leaf',       color: '#22c55e', description: 'Citologia, Genética e Ecologia',                   displayOrder: 5 },
  { id: 'ao10-geo',  gradeId: 'ao-10c', name: 'Geografia',         shortName: 'GEO', icon: 'fa-globe-africa',color:'#0ea5e9', description: 'Angola e África — Cartografia e Relevo',           displayOrder: 6 },
  { id: 'ao10-his',  gradeId: 'ao-10c', name: 'História',          shortName: 'HIS', icon: 'fa-landmark',   color: '#dc2626', description: 'História de Angola e de África',                   displayOrder: 7 },
  { id: 'ao10-ing',  gradeId: 'ao-10c', name: 'Língua Inglesa',   shortName: 'ING', icon: 'fa-language',   color: '#7c3aed', description: 'Inglês — Comunicação e Gramática',                 displayOrder: 8 },
  { id: 'ao10-fil',  gradeId: 'ao-10c', name: 'Filosofia',         shortName: 'FIL', icon: 'fa-brain',      color: '#64748b', description: 'Introdução à Filosofia e Lógica',                  displayOrder: 9 },

  // ══ ANGOLA 11ª Classe ══
  { id: 'ao11-mat',  gradeId: 'ao-11c', name: 'Matemática',        shortName: 'MAT', icon: 'fa-calculator', color: '#9333ea', description: 'Álgebra Linear, Derivadas e Integrais',            displayOrder: 1 },
  { id: 'ao11-port', gradeId: 'ao-11c', name: 'Língua Portuguesa', shortName: 'PORT',icon: 'fa-book-open',  color: '#3b82f6', description: 'Produção Textual e Literatura Africana',           displayOrder: 2 },
  { id: 'ao11-fis',  gradeId: 'ao-11c', name: 'Física',            shortName: 'FIS', icon: 'fa-atom',       color: '#10b981', description: 'Electromagnetismo, Óptica e Física Moderna',       displayOrder: 3 },
  { id: 'ao11-qui',  gradeId: 'ao-11c', name: 'Química',           shortName: 'QUI', icon: 'fa-flask',      color: '#f59e0b', description: 'Cinética Química e Química Orgânica',              displayOrder: 4 },
  { id: 'ao11-bio',  gradeId: 'ao-11c', name: 'Biologia',          shortName: 'BIO', icon: 'fa-leaf',       color: '#22c55e', description: 'Genética Molecular e Evolução',                    displayOrder: 5 },

  // ══ ANGOLA 12ª Classe ══
  { id: 'ao12-mat',  gradeId: 'ao-12c', name: 'Matemática',        shortName: 'MAT', icon: 'fa-calculator', color: '#9333ea', description: 'Probabilidades, Estatística e Números Complexos',  displayOrder: 1 },
  { id: 'ao12-port', gradeId: 'ao-12c', name: 'Língua Portuguesa', shortName: 'PORT',icon: 'fa-book-open',  color: '#3b82f6', description: 'Análise Literária e Argumentação',                 displayOrder: 2 },
  { id: 'ao12-fis',  gradeId: 'ao-12c', name: 'Física',            shortName: 'FIS', icon: 'fa-atom',       color: '#10b981', description: 'Física Atómica, Nuclear e Relatividade',           displayOrder: 3 },
  { id: 'ao12-qui',  gradeId: 'ao-12c', name: 'Química',           shortName: 'QUI', icon: 'fa-flask',      color: '#f59e0b', description: 'Química Ambiental e Industrial',                   displayOrder: 4 },
  { id: 'ao12-bio',  gradeId: 'ao-12c', name: 'Biologia',          shortName: 'BIO', icon: 'fa-leaf',       color: '#22c55e', description: 'Microbiologia, Imunologia e Biotecnologia',         displayOrder: 5 },

  // ══ BRASIL 1º Ano EM ══
  { id: 'br1em-mat', gradeId: 'br-1em', name: 'Matemática',        shortName: 'MAT', icon: 'fa-calculator', color: '#9333ea', description: 'Conjuntos, Funções e Trigonometria',               displayOrder: 1 },
  { id: 'br1em-por', gradeId: 'br-1em', name: 'Língua Portuguesa', shortName: 'PORT',icon: 'fa-book-open',  color: '#3b82f6', description: 'Gramática, Literatura e Redação',                  displayOrder: 2 },
  { id: 'br1em-fis', gradeId: 'br-1em', name: 'Física',            shortName: 'FIS', icon: 'fa-atom',       color: '#10b981', description: 'Cinemática, Dinâmica e Gravitação',                displayOrder: 3 },
  { id: 'br1em-qui', gradeId: 'br-1em', name: 'Química',           shortName: 'QUI', icon: 'fa-flask',      color: '#f59e0b', description: 'Estrutura da Matéria e Transformações Químicas',   displayOrder: 4 },
  { id: 'br1em-bio', gradeId: 'br-1em', name: 'Biologia',          shortName: 'BIO', icon: 'fa-leaf',       color: '#22c55e', description: 'Citologia, Histologia e Embriologia',              displayOrder: 5 },
  { id: 'br1em-his', gradeId: 'br-1em', name: 'História',          shortName: 'HIS', icon: 'fa-landmark',   color: '#dc2626', description: 'Pré-História ao Brasil Colonial',                   displayOrder: 6 },
  { id: 'br1em-geo', gradeId: 'br-1em', name: 'Geografia',         shortName: 'GEO', icon: 'fa-globe-americas',color:'#0ea5e9','description': 'Cartografia, Geopolítica e Geomorfologia',      displayOrder: 7 },
  { id: 'br1em-ing', gradeId: 'br-1em', name: 'Inglês',            shortName: 'ING', icon: 'fa-language',   color: '#7c3aed', description: 'Língua Inglesa — Comunicação e Gramática',         displayOrder: 8 },
  { id: 'br1em-fil', gradeId: 'br-1em', name: 'Filosofia',         shortName: 'FIL', icon: 'fa-brain',      color: '#64748b', description: 'Introdução à Filosofia e Pensamento Crítico',      displayOrder: 9 },
  { id: 'br1em-soc', gradeId: 'br-1em', name: 'Sociologia',        shortName: 'SOC', icon: 'fa-users',      color: '#ec4899', description: 'Sociedade, Cultura e Desigualdade Social',         displayOrder: 10 },
  { id: 'br1em-art', gradeId: 'br-1em', name: 'Arte',              shortName: 'ART', icon: 'fa-palette',    color: '#f97316', description: 'História da Arte, Música e Teatro',                displayOrder: 11 },

  // ══ BRASIL 2º Ano EM ══
  { id: 'br2em-mat', gradeId: 'br-2em', name: 'Matemática',        shortName: 'MAT', icon: 'fa-calculator', color: '#9333ea', description: 'Geometria Plana, Espacial e Probabilidade',        displayOrder: 1 },
  { id: 'br2em-por', gradeId: 'br-2em', name: 'Língua Portuguesa', shortName: 'PORT',icon: 'fa-book-open',  color: '#3b82f6', description: 'Modernismo, Redação Argumentativa',                displayOrder: 2 },
  { id: 'br2em-fis', gradeId: 'br-2em', name: 'Física',            shortName: 'FIS', icon: 'fa-atom',       color: '#10b981', description: 'Termodinâmica, Ondulatória e Óptica',             displayOrder: 3 },
  { id: 'br2em-qui', gradeId: 'br-2em', name: 'Química',           shortName: 'QUI', icon: 'fa-flask',      color: '#f59e0b', description: 'Soluções, Termoquímica e Cinética',               displayOrder: 4 },
  { id: 'br2em-bio', gradeId: 'br-2em', name: 'Biologia',          shortName: 'BIO', icon: 'fa-leaf',       color: '#22c55e', description: 'Genética, Evolução e Ecologia',                    displayOrder: 5 },
  { id: 'br2em-his', gradeId: 'br-2em', name: 'História',          shortName: 'HIS', icon: 'fa-landmark',   color: '#dc2626', description: 'Brasil Império, República Velha e Revolução 30',  displayOrder: 6 },
  { id: 'br2em-geo', gradeId: 'br-2em', name: 'Geografia',         shortName: 'GEO', icon: 'fa-globe-americas',color:'#0ea5e9','description': 'Urbanização, Globalização e Meio Ambiente',      displayOrder: 7 },

  // ══ BRASIL 3º Ano EM ══
  { id: 'br3em-mat', gradeId: 'br-3em', name: 'Matemática',        shortName: 'MAT', icon: 'fa-calculator', color: '#9333ea', description: 'Análise Combinatória, Matrizes e PA/PG',           displayOrder: 1 },
  { id: 'br3em-por', gradeId: 'br-3em', name: 'Língua Portuguesa', shortName: 'PORT',icon: 'fa-book-open',  color: '#3b82f6', description: 'Pós-Modernismo, Redação ENEM',                    displayOrder: 2 },
  { id: 'br3em-fis', gradeId: 'br-3em', name: 'Física',            shortName: 'FIS', icon: 'fa-atom',       color: '#10b981', description: 'Electromagnetismo, Física Moderna e Nuclear',     displayOrder: 3 },
  { id: 'br3em-qui', gradeId: 'br-3em', name: 'Química',           shortName: 'QUI', icon: 'fa-flask',      color: '#f59e0b', description: 'Química Orgânica Avançada e Ambiental',           displayOrder: 4 },
  { id: 'br3em-bio', gradeId: 'br-3em', name: 'Biologia',          shortName: 'BIO', icon: 'fa-leaf',       color: '#22c55e', description: 'Fisiologia Humana, Microbiologia e Imunologia',   displayOrder: 5 },

  // ══ PORTUGAL 10º Ano ══
  { id: 'pt10-mat',  gradeId: 'pt-10a', name: 'Matemática A',      shortName: 'MAT', icon: 'fa-calculator', color: '#9333ea', description: 'Funções, Trigonometria e Geometria Analítica',    displayOrder: 1 },
  { id: 'pt10-port', gradeId: 'pt-10a', name: 'Português',         shortName: 'PORT',icon: 'fa-book-open',  color: '#3b82f6', description: 'Literatura Portuguesa e Produção Textual',        displayOrder: 2 },
  { id: 'pt10-fis',  gradeId: 'pt-10a', name: 'Física e Química A',shortName: 'FQ',  icon: 'fa-atom',       color: '#10b981', description: 'Física — Cinemática, Dinâmica; Química Geral',   displayOrder: 3 },
  { id: 'pt10-bio',  gradeId: 'pt-10a', name: 'Biologia e Geologia',shortName: 'BG',  icon: 'fa-leaf',       color: '#22c55e', description: 'Célula, Geologia e Tectónica de Placas',         displayOrder: 4 },
  { id: 'pt10-his',  gradeId: 'pt-10a', name: 'História A',        shortName: 'HIS', icon: 'fa-landmark',   color: '#dc2626', description: 'Expansão Europeia e Mundo Moderno',               displayOrder: 5 },
  { id: 'pt10-geo',  gradeId: 'pt-10a', name: 'Geografia A',       shortName: 'GEO', icon: 'fa-globe-europe',color:'#0ea5e9', description: 'Espaço Europeu, Mobilidade e Globalização',      displayOrder: 6 },
  { id: 'pt10-ing',  gradeId: 'pt-10a', name: 'Inglês',            shortName: 'ING', icon: 'fa-language',   color: '#7c3aed', description: 'Inglês B1/B2 — Comunicação Avançada',             displayOrder: 7 },
  { id: 'pt10-fil',  gradeId: 'pt-10a', name: 'Filosofia',         shortName: 'FIL', icon: 'fa-brain',      color: '#64748b', description: 'Argumentação, Ética e Ontologia',                 displayOrder: 8 },
  { id: 'pt10-tgi',  gradeId: 'pt-10a', name: 'TIC',               shortName: 'TIC', icon: 'fa-laptop-code',color: '#f97316', description: 'Tecnologias de Informação e Comunicação',         displayOrder: 9 },

  // ══ PORTUGAL 11º Ano ══
  { id: 'pt11-mat',  gradeId: 'pt-11a', name: 'Matemática A',      shortName: 'MAT', icon: 'fa-calculator', color: '#9333ea', description: 'Cálculo Diferencial, Sucessões e Combinatória',   displayOrder: 1 },
  { id: 'pt11-port', gradeId: 'pt-11a', name: 'Português',         shortName: 'PORT',icon: 'fa-book-open',  color: '#3b82f6', description: 'Modernismo, Pessoa e Produção Textual',           displayOrder: 2 },
  { id: 'pt11-fis',  gradeId: 'pt-11a', name: 'Física e Química A',shortName: 'FQ',  icon: 'fa-atom',       color: '#10b981', description: 'Electromagnetismo, Termoquímica, Equilíbrio',    displayOrder: 3 },
  { id: 'pt11-bio',  gradeId: 'pt-11a', name: 'Biologia',          shortName: 'BIO', icon: 'fa-leaf',       color: '#22c55e', description: 'Genética, Evolução e Imunologia',                 displayOrder: 4 },
  { id: 'pt11-his',  gradeId: 'pt-11a', name: 'História A',        shortName: 'HIS', icon: 'fa-landmark',   color: '#dc2626', description: 'Liberalismo, Imperialismo e Primeira Guerra',      displayOrder: 5 },

  // ══ PORTUGAL 12º Ano ══
  { id: 'pt12-mat',  gradeId: 'pt-12a', name: 'Matemática A',      shortName: 'MAT', icon: 'fa-calculator', color: '#9333ea', description: 'Integral, Probabilidades e Exame Nacional',       displayOrder: 1 },
  { id: 'pt12-port', gradeId: 'pt-12a', name: 'Português',         shortName: 'PORT',icon: 'fa-book-open',  color: '#3b82f6', description: 'Pós-Modernismo, Exame Nacional e Redação',       displayOrder: 2 },
  { id: 'pt12-fis',  gradeId: 'pt-12a', name: 'Física e Química A',shortName: 'FQ',  icon: 'fa-atom',       color: '#10b981', description: 'Física Moderna, Radioactividade e Electroquímica',displayOrder: 3 },
  { id: 'pt12-bio',  gradeId: 'pt-12a', name: 'Biologia',          shortName: 'BIO', icon: 'fa-leaf',       color: '#22c55e', description: 'Neurobiologia, Biotecnologia e Bioética',          displayOrder: 4 },

  // ══ CABO VERDE 10º Ano ══
  { id: 'cv10-mat',  gradeId: 'cv-10a', name: 'Matemática',        shortName: 'MAT', icon: 'fa-calculator', color: '#9333ea', description: 'Funções, Geometria e Trigonometria',               displayOrder: 1 },
  { id: 'cv10-port', gradeId: 'cv-10a', name: 'Língua Portuguesa', shortName: 'PORT',icon: 'fa-book-open',  color: '#3b82f6', description: 'Literatura Cabo-Verdiana e Produção Textual',     displayOrder: 2 },
  { id: 'cv10-fis',  gradeId: 'cv-10a', name: 'Física',            shortName: 'FIS', icon: 'fa-atom',       color: '#10b981', description: 'Mecânica, Termodinâmica e Electricidade',          displayOrder: 3 },
  { id: 'cv10-qui',  gradeId: 'cv-10a', name: 'Química',           shortName: 'QUI', icon: 'fa-flask',      color: '#f59e0b', description: 'Química Geral e Inorgânica',                       displayOrder: 4 },
  { id: 'cv10-bio',  gradeId: 'cv-10a', name: 'Biologia',          shortName: 'BIO', icon: 'fa-leaf',       color: '#22c55e', description: 'Citologia, Genética e Ecologia',                   displayOrder: 5 },
  { id: 'cv10-geo',  gradeId: 'cv-10a', name: 'Geografia',         shortName: 'GEO', icon: 'fa-globe-africa',color:'#0ea5e9', description: 'Cabo Verde e África — Recursos e Desenvolvimento', displayOrder: 6 },
  { id: 'cv10-his',  gradeId: 'cv-10a', name: 'História',          shortName: 'HIS', icon: 'fa-landmark',   color: '#dc2626', description: 'História de Cabo Verde e do Mundo Contemporâneo',  displayOrder: 7 },
  { id: 'cv10-ing',  gradeId: 'cv-10a', name: 'Inglês',            shortName: 'ING', icon: 'fa-language',   color: '#7c3aed', description: 'Inglês B1 — Comunicação e Gramática',              displayOrder: 8 },
];

// ============================================================
//  CAPÍTULOS (por disciplina — trimestres/bimestres)
// ============================================================
export const CHAPTERS: Chapter[] = [

  // ══════════════════════════════════════════════════════════
  //  MOÇAMBIQUE 10ª Classe
  // ══════════════════════════════════════════════════════════

  // ─── Matemática 10ª Classe ────────────────────────────────
  { id:'mz10mat-1-1', subjectId:'mz10-mat', title:'Funções Reais de Variável Real',         description:'Domínio, contradomínio, crescimento e monotonicidade',         term:1, displayOrder:1 },
  { id:'mz10mat-1-2', subjectId:'mz10-mat', title:'Equações e Inequações do 2º Grau',        description:'Fórmula resolvente, discriminante e intervalos',                term:1, displayOrder:2 },
  { id:'mz10mat-1-3', subjectId:'mz10-mat', title:'Sistemas de Equações',                   description:'Métodos de substituição, eliminação e Cramer',                  term:1, displayOrder:3 },
  { id:'mz10mat-2-1', subjectId:'mz10-mat', title:'Trigonometria',                          description:'Seno, cosseno, tangente e fórmulas trigonométricas',             term:2, displayOrder:4 },
  { id:'mz10mat-2-2', subjectId:'mz10-mat', title:'Progressões Aritméticas e Geométricas',  description:'Termos, somas e aplicações financeiras',                         term:2, displayOrder:5 },
  { id:'mz10mat-2-3', subjectId:'mz10-mat', title:'Logaritmos e Exponenciais',              description:'Propriedades dos logaritmos e equações exponenciais',            term:2, displayOrder:6 },
  { id:'mz10mat-3-1', subjectId:'mz10-mat', title:'Matrizes e Determinantes',               description:'Operações matriciais e regra de Sarrus',                         term:3, displayOrder:7 },
  { id:'mz10mat-3-2', subjectId:'mz10-mat', title:'Geometria Analítica',                   description:'Ponto, recta e circunferência no plano cartesiano',              term:3, displayOrder:8 },
  { id:'mz10mat-3-3', subjectId:'mz10-mat', title:'Combinatória e Probabilidade',           description:'Permutações, combinações e probabilidade clássica',              term:3, displayOrder:9 },

  // ─── Português 10ª Classe ─────────────────────────────────
  { id:'mz10por-1-1', subjectId:'mz10-port', title:'Classes de Palavras',                  description:'Substantivos, adjectivos, verbos e classes invariáveis',         term:1, displayOrder:1 },
  { id:'mz10por-1-2', subjectId:'mz10-port', title:'Análise Sintáctica',                  description:'Sujeito, predicado, complementos e aposto',                       term:1, displayOrder:2 },
  { id:'mz10por-1-3', subjectId:'mz10-port', title:'Literatura Portuguesa — Clássicos',   description:'Camões, Fernão Lopes e o Renascimento',                           term:1, displayOrder:3 },
  { id:'mz10por-2-1', subjectId:'mz10-port', title:'Orações Coordenadas e Subordinadas',  description:'Tipos de orações e funções sintácticas',                          term:2, displayOrder:4 },
  { id:'mz10por-2-2', subjectId:'mz10-port', title:'Literatura Moçambicana',              description:'José Craveirinha, Noémia de Sousa e autores contemporâneos',      term:2, displayOrder:5 },
  { id:'mz10por-2-3', subjectId:'mz10-port', title:'Texto Narrativo',                     description:'Elementos da narrativa e análise de conto e romance',             term:2, displayOrder:6 },
  { id:'mz10por-3-1', subjectId:'mz10-port', title:'Texto Argumentativo e Dissertação',   description:'Estrutura, argumentos e contra-argumentos',                       term:3, displayOrder:7 },
  { id:'mz10por-3-2', subjectId:'mz10-port', title:'Literatura Africana dos PALOP',       description:'Agostinho Neto, Amílcar Cabral e a poesia da resistência',        term:3, displayOrder:8 },
  { id:'mz10por-3-3', subjectId:'mz10-port', title:'Figuras de Estilo e Versificação',    description:'Metáfora, metonímia, aliteração e análise poética',               term:3, displayOrder:9 },

  // ─── Física 10ª Classe ────────────────────────────────────
  { id:'mz10fis-1-1', subjectId:'mz10-fis', title:'Cinemática',                           description:'MU, MUV, gráficos e queda livre',                                term:1, displayOrder:1 },
  { id:'mz10fis-1-2', subjectId:'mz10-fis', title:'Dinâmica — Leis de Newton',            description:'Inércia, F=ma e acção-reacção',                                   term:1, displayOrder:2 },
  { id:'mz10fis-1-3', subjectId:'mz10-fis', title:'Trabalho e Energia',                   description:'Energia cinética, potencial e conservação',                       term:1, displayOrder:3 },
  { id:'mz10fis-2-1', subjectId:'mz10-fis', title:'Termodinâmica',                        description:'Temperatura, calor, dilatação e calorimetria',                    term:2, displayOrder:4 },
  { id:'mz10fis-2-2', subjectId:'mz10-fis', title:'Óptica Geométrica',                    description:'Reflexão, refracção, espelhos e lentes',                          term:2, displayOrder:5 },
  { id:'mz10fis-2-3', subjectId:'mz10-fis', title:'Ondulatória',                          description:'Ondas mecânicas, som e EM',                                       term:2, displayOrder:6 },
  { id:'mz10fis-3-1', subjectId:'mz10-fis', title:'Electrostática',                       description:'Carga, lei de Coulomb e campo eléctrico',                         term:3, displayOrder:7 },
  { id:'mz10fis-3-2', subjectId:'mz10-fis', title:'Electrodynamica e Circuitos',          description:'Corrente, tensão, resistência e lei de Ohm',                      term:3, displayOrder:8 },
  { id:'mz10fis-3-3', subjectId:'mz10-fis', title:'Magnetismo',                           description:'Campo magnético, electroíman e indução',                          term:3, displayOrder:9 },

  // ─── Química 10ª Classe ───────────────────────────────────
  { id:'mz10qui-1-1', subjectId:'mz10-qui', title:'Estrutura Atómica',                    description:'Protões, neutrões, electrões e modelos atómicos',                 term:1, displayOrder:1 },
  { id:'mz10qui-1-2', subjectId:'mz10-qui', title:'Tabela Periódica',                     description:'Períodos, grupos e propriedades periódicas',                      term:1, displayOrder:2 },
  { id:'mz10qui-1-3', subjectId:'mz10-qui', title:'Ligações Químicas',                    description:'Iónica, covalente, metálica e intermolecular',                    term:1, displayOrder:3 },
  { id:'mz10qui-2-1', subjectId:'mz10-qui', title:'Funções Inorgânicas',                  description:'Ácidos, bases, sais e óxidos',                                    term:2, displayOrder:4 },
  { id:'mz10qui-2-2', subjectId:'mz10-qui', title:'Reacções Químicas',                    description:'Balanceamento e tipos de reacções',                               term:2, displayOrder:5 },
  { id:'mz10qui-2-3', subjectId:'mz10-qui', title:'Estequiometria',                       description:'Mole, cálculos estequiométricos e rendimento',                    term:2, displayOrder:6 },
  { id:'mz10qui-3-1', subjectId:'mz10-qui', title:'Soluções e Concentrações',             description:'Solvente, soluto, molaridade e diluição',                         term:3, displayOrder:7 },
  { id:'mz10qui-3-2', subjectId:'mz10-qui', title:'Química Orgânica — Introdução',        description:'Hidrocarbonetos, nomenclatura e isomeria',                        term:3, displayOrder:8 },
  { id:'mz10qui-3-3', subjectId:'mz10-qui', title:'Funções Orgânicas',                    description:'Álcoois, aldeídos, cetonas e ácidos carboxílicos',                term:3, displayOrder:9 },

  // ─── Biologia 10ª Classe ──────────────────────────────────
  { id:'mz10bio-1-1', subjectId:'mz10-bio', title:'A Célula',                             description:'Estrutura, organelos e diferença procariota/eucariota',            term:1, displayOrder:1 },
  { id:'mz10bio-1-2', subjectId:'mz10-bio', title:'Metabolismo Celular',                  description:'Respiração celular e fotossíntese',                               term:1, displayOrder:2 },
  { id:'mz10bio-1-3', subjectId:'mz10-bio', title:'Divisão Celular',                      description:'Mitose, meiose e ciclo celular',                                  term:1, displayOrder:3 },
  { id:'mz10bio-2-1', subjectId:'mz10-bio', title:'Genética Mendeliana',                  description:'1ª e 2ª Lei de Mendel e cruzamentos',                             term:2, displayOrder:4 },
  { id:'mz10bio-2-2', subjectId:'mz10-bio', title:'DNA, RNA e Síntese Proteica',          description:'Estrutura do DNA, transcrição e tradução',                        term:2, displayOrder:5 },
  { id:'mz10bio-2-3', subjectId:'mz10-bio', title:'Evolução',                             description:'Darwin, Lamarck e selecção natural',                              term:2, displayOrder:6 },
  { id:'mz10bio-3-1', subjectId:'mz10-bio', title:'Ecologia',                             description:'Cadeias alimentares, fluxo de energia e ciclos biogeoquímicos',   term:3, displayOrder:7 },
  { id:'mz10bio-3-2', subjectId:'mz10-bio', title:'Taxonomia e Classificação',            description:'Reinos, filo, classe, ordem e espécie',                           term:3, displayOrder:8 },
  { id:'mz10bio-3-3', subjectId:'mz10-bio', title:'Fisiologia Humana',                    description:'Sistemas circulatório, digestivo, nervoso e reprodutor',          term:3, displayOrder:9 },

  // ─── Geografia 10ª Classe ─────────────────────────────────
  { id:'mz10geo-1-1', subjectId:'mz10-geo', title:'Cartografia e Orientação',             description:'Mapas, escalas, coordenadas geográficas e bússola',              term:1, displayOrder:1 },
  { id:'mz10geo-1-2', subjectId:'mz10-geo', title:'Geomorfologia',                        description:'Relevo de Moçambique e África',                                   term:1, displayOrder:2 },
  { id:'mz10geo-1-3', subjectId:'mz10-geo', title:'Hidrografia',                          description:'Bacias hidrográficas de Moçambique e recursos hídricos',          term:1, displayOrder:3 },
  { id:'mz10geo-2-1', subjectId:'mz10-geo', title:'Climatologia',                         description:'Tipos de clima, factores e climas de Moçambique',                 term:2, displayOrder:4 },
  { id:'mz10geo-2-2', subjectId:'mz10-geo', title:'População e Urbanização',              description:'Crescimento demográfico e cidades de Moçambique',                 term:2, displayOrder:5 },
  { id:'mz10geo-2-3', subjectId:'mz10-geo', title:'Agricultura e Recursos Naturais',      description:'Produtos agrícolas, minerais e pesca em Moçambique',              term:2, displayOrder:6 },
  { id:'mz10geo-3-1', subjectId:'mz10-geo', title:'Indústria e Energia',                  description:'Sectores industriais e fontes de energia em Moçambique',          term:3, displayOrder:7 },
  { id:'mz10geo-3-2', subjectId:'mz10-geo', title:'Globalização e Comércio',              description:'Comércio internacional, SADC e África',                           term:3, displayOrder:8 },
  { id:'mz10geo-3-3', subjectId:'mz10-geo', title:'Problemas Ambientais Globais',         description:'Desertificação, desflorestação e alterações climáticas',          term:3, displayOrder:9 },

  // ─── História 10ª Classe ──────────────────────────────────
  { id:'mz10his-1-1', subjectId:'mz10-his', title:'Sociedades Pré-Coloniais em Moçambique', description:'Reinos do Monomotapa, Maravi e Rozwi',                          term:1, displayOrder:1 },
  { id:'mz10his-1-2', subjectId:'mz10-his', title:'Expansão Portuguesa e Colonização',    description:'Chegada dos portugueses e estabelecimento colonial',              term:1, displayOrder:2 },
  { id:'mz10his-1-3', subjectId:'mz10-his', title:'Resistência à Colonização',             description:'Resistências armadas e movimentos de oposição',                  term:1, displayOrder:3 },
  { id:'mz10his-2-1', subjectId:'mz10-his', title:'Imperialismo e Partilha de África',    description:'Conferência de Berlim e consequências para Moçambique',           term:2, displayOrder:4 },
  { id:'mz10his-2-2', subjectId:'mz10-his', title:'Primeira e Segunda Guerras Mundiais',  description:'Causas, desenvolvimento e impacto em África',                     term:2, displayOrder:5 },
  { id:'mz10his-2-3', subjectId:'mz10-his', title:'Movimentos de Libertação Nacional',    description:'FRELIMO e a luta armada de libertação (1964–1974)',               term:2, displayOrder:6 },
  { id:'mz10his-3-1', subjectId:'mz10-his', title:'Independência de Moçambique',          description:'25 de Junho de 1975 e os primeiros anos da República',            term:3, displayOrder:7 },
  { id:'mz10his-3-2', subjectId:'mz10-his', title:'Guerra Civil e Processo de Paz',       description:'Conflito armado e Acordo Geral de Paz (1992)',                    term:3, displayOrder:8 },
  { id:'mz10his-3-3', subjectId:'mz10-his', title:'Descolonização em África',             description:'Movimentos independentistas e neocolonialismo',                   term:3, displayOrder:9 },

  // ─── Inglês 10ª Classe ────────────────────────────────────
  { id:'mz10ing-1-1', subjectId:'mz10-ing', title:'Present Simple & Continuous',          description:'Uso, formação e expressões de tempo',                             term:1, displayOrder:1 },
  { id:'mz10ing-1-2', subjectId:'mz10-ing', title:'Past Simple & Past Continuous',        description:'Narração de eventos passados e interrompidos',                    term:1, displayOrder:2 },
  { id:'mz10ing-1-3', subjectId:'mz10-ing', title:'Modal Verbs',                          description:'Can, could, must, should, will — uso e significado',              term:1, displayOrder:3 },
  { id:'mz10ing-2-1', subjectId:'mz10-ing', title:'Future Tenses',                        description:'Will, going to, present continuous for future',                   term:2, displayOrder:4 },
  { id:'mz10ing-2-2', subjectId:'mz10-ing', title:'Conditional Sentences',                description:'Zero, 1st, 2nd and 3rd conditionals',                             term:2, displayOrder:5 },
  { id:'mz10ing-2-3', subjectId:'mz10-ing', title:'Passive Voice',                        description:'Formation and use of passive in different tenses',                term:2, displayOrder:6 },
  { id:'mz10ing-3-1', subjectId:'mz10-ing', title:'Reading Comprehension',                description:'Strategies for texts, news articles and academic passages',       term:3, displayOrder:7 },
  { id:'mz10ing-3-2', subjectId:'mz10-ing', title:'Writing — Formal & Informal',         description:'Letters, emails, essays and reports',                             term:3, displayOrder:8 },
  { id:'mz10ing-3-3', subjectId:'mz10-ing', title:'Vocabulary & Idioms',                  description:'Word formation, collocations and common idioms',                  term:3, displayOrder:9 },

  // ══════════════════════════════════════════════════════════
  //  MOÇAMBIQUE 11ª Classe
  // ══════════════════════════════════════════════════════════
  { id:'mz11mat-1-1', subjectId:'mz11-mat', title:'Limites e Continuidade',               description:'Noção de limite, limites laterais e continuidade de funções',     term:1, displayOrder:1 },
  { id:'mz11mat-1-2', subjectId:'mz11-mat', title:'Derivadas',                            description:'Definição, regras de derivação e aplicações',                     term:1, displayOrder:2 },
  { id:'mz11mat-2-1', subjectId:'mz11-mat', title:'Integrais',                            description:'Primitivas, integral definido e aplicações',                      term:2, displayOrder:3 },
  { id:'mz11mat-2-2', subjectId:'mz11-mat', title:'Álgebra Linear — Vectores',            description:'Vectores no plano e no espaço, produto escalar e vectorial',      term:2, displayOrder:4 },
  { id:'mz11mat-3-1', subjectId:'mz11-mat', title:'Geometria no Espaço',                  description:'Poliedros, esferas e cálculo de volume',                          term:3, displayOrder:5 },
  { id:'mz11mat-3-2', subjectId:'mz11-mat', title:'Probabilidades e Estatística',         description:'Distribuições, esperança matemática e testes',                    term:3, displayOrder:6 },

  { id:'mz11fis-1-1', subjectId:'mz11-fis', title:'Óptica Física — Interferência e Difracção', description:'Natureza da luz, dupla fenda e rede de difracção',            term:1, displayOrder:1 },
  { id:'mz11fis-1-2', subjectId:'mz11-fis', title:'Electromagnetismo',                   description:'Lei de Faraday, indução e transformadores',                       term:1, displayOrder:2 },
  { id:'mz11fis-2-1', subjectId:'mz11-fis', title:'Corrente Alternada',                   description:'CA, frequência, valor eficaz e circuitos RLC',                    term:2, displayOrder:3 },
  { id:'mz11fis-2-2', subjectId:'mz11-fis', title:'Física Moderna — Quântica',            description:'Fotão, efeito fotoeléctrico e modelo de Bohr',                    term:2, displayOrder:4 },
  { id:'mz11fis-3-1', subjectId:'mz11-fis', title:'Física Nuclear',                       description:'Radioactividade, fissão e fusão nuclear',                         term:3, displayOrder:5 },
  { id:'mz11fis-3-2', subjectId:'mz11-fis', title:'Relatividade Especial',                description:'Postulados de Einstein e dilatação do tempo',                     term:3, displayOrder:6 },

  // ══════════════════════════════════════════════════════════
  //  MOÇAMBIQUE 12ª Classe
  // ══════════════════════════════════════════════════════════
  { id:'mz12mat-1-1', subjectId:'mz12-mat', title:'Cálculo Integral Avançado',            description:'Integrais duplos, por partes e por fracções parciais',            term:1, displayOrder:1 },
  { id:'mz12mat-2-1', subjectId:'mz12-mat', title:'Números Complexos',                    description:'Forma algébrica, trigonométrica e exponencial',                   term:2, displayOrder:2 },
  { id:'mz12mat-3-1', subjectId:'mz12-mat', title:'Revisão para Exame Nacional',          description:'Todos os temas do ESG2 com exercícios de exames anteriores',      term:3, displayOrder:3 },

  { id:'mz12fis-1-1', subjectId:'mz12-fis', title:'Física Atómica e Espectros',           description:'Espectros de emissão e absorção, lasers',                         term:1, displayOrder:1 },
  { id:'mz12fis-2-1', subjectId:'mz12-fis', title:'Energia Nuclear e Reactores',          description:'Aplicações da energia nuclear e segurança',                       term:2, displayOrder:2 },
  { id:'mz12fis-3-1', subjectId:'mz12-fis', title:'Revisão para Exame Nacional',          description:'Exercícios de exames anteriores e simulações',                    term:3, displayOrder:3 },

  // ══════════════════════════════════════════════════════════
  //  ANGOLA 10ª Classe
  // ══════════════════════════════════════════════════════════
  { id:'ao10mat-1-1', subjectId:'ao10-mat', title:'Funções e Gráficos',                   description:'Domínio, imagem e representação gráfica',                         term:1, displayOrder:1 },
  { id:'ao10mat-1-2', subjectId:'ao10-mat', title:'Trigonometria',                        description:'Razões trigonométricas e fórmulas',                               term:1, displayOrder:2 },
  { id:'ao10mat-1-3', subjectId:'ao10-mat', title:'Equações e Sistemas',                  description:'Equações do 2º grau e sistemas lineares',                         term:1, displayOrder:3 },
  { id:'ao10mat-2-1', subjectId:'ao10-mat', title:'Progressões',                          description:'PA, PG e aplicações financeiras',                                  term:2, displayOrder:4 },
  { id:'ao10mat-2-2', subjectId:'ao10-mat', title:'Logaritmos',                           description:'Definição, propriedades e equações logarítmicas',                 term:2, displayOrder:5 },
  { id:'ao10mat-3-1', subjectId:'ao10-mat', title:'Geometria Analítica',                  description:'Recta, circunferência e cônicas no plano',                        term:3, displayOrder:6 },
  { id:'ao10mat-3-2', subjectId:'ao10-mat', title:'Estatística Descritiva',               description:'Médias, medidas de dispersão e gráficos',                         term:3, displayOrder:7 },

  { id:'ao10por-1-1', subjectId:'ao10-port', title:'Texto e Contexto',                   description:'Análise textual e intenção comunicativa',                         term:1, displayOrder:1 },
  { id:'ao10por-1-2', subjectId:'ao10-port', title:'Literatura Angolana — Poesia',        description:'Agostinho Neto, Viriato da Cruz e a poesia nacional',             term:1, displayOrder:2 },
  { id:'ao10por-2-1', subjectId:'ao10-port', title:'Gramática Normativa',                 description:'Morfologia, sintaxe e semântica',                                 term:2, displayOrder:3 },
  { id:'ao10por-2-2', subjectId:'ao10-port', title:'Literatura Angolana — Prosa',         description:'Luandino Vieira e Pepetela',                                      term:2, displayOrder:4 },
  { id:'ao10por-3-1', subjectId:'ao10-port', title:'Produção Textual',                    description:'Dissertação, relato e carta oficial',                             term:3, displayOrder:5 },
  { id:'ao10por-3-2', subjectId:'ao10-port', title:'Literatura Portuguesa',               description:'Eça de Queirós e o Realismo',                                     term:3, displayOrder:6 },

  { id:'ao10fis-1-1', subjectId:'ao10-fis', title:'Cinemática',                           description:'MU, MUV e movimento circular',                                    term:1, displayOrder:1 },
  { id:'ao10fis-1-2', subjectId:'ao10-fis', title:'Dinâmica',                             description:'Leis de Newton e aplicações',                                     term:1, displayOrder:2 },
  { id:'ao10fis-2-1', subjectId:'ao10-fis', title:'Termodinâmica',                        description:'Leis da termodinâmica e máquinas térmicas',                       term:2, displayOrder:3 },
  { id:'ao10fis-2-2', subjectId:'ao10-fis', title:'Ondas e Som',                          description:'Propriedades das ondas, som e ultrassom',                         term:2, displayOrder:4 },
  { id:'ao10fis-3-1', subjectId:'ao10-fis', title:'Electricidade e Magnetismo',           description:'Circuitos, lei de Ohm e electromagnetismo',                       term:3, displayOrder:5 },

  { id:'ao10bio-1-1', subjectId:'ao10-bio', title:'Célula — Estrutura e Função',          description:'Organelos e processos celulares',                                 term:1, displayOrder:1 },
  { id:'ao10bio-1-2', subjectId:'ao10-bio', title:'Metabolismo Celular',                  description:'Fotossíntese e respiração aeróbica e anaeróbica',                 term:1, displayOrder:2 },
  { id:'ao10bio-2-1', subjectId:'ao10-bio', title:'Genética',                             description:'Leis de Mendel e heranças complexas',                             term:2, displayOrder:3 },
  { id:'ao10bio-2-2', subjectId:'ao10-bio', title:'Evolução e Biodiversidade',            description:'Selecção natural e adaptações',                                   term:2, displayOrder:4 },
  { id:'ao10bio-3-1', subjectId:'ao10-bio', title:'Ecologia e Ambiente em Angola',        description:'Ecossistemas angolanos e conservação',                            term:3, displayOrder:5 },
  { id:'ao10bio-3-2', subjectId:'ao10-bio', title:'Fisiologia Humana',                    description:'Sistemas do organismo humano',                                    term:3, displayOrder:6 },

  // ══════════════════════════════════════════════════════════
  //  ANGOLA — 7ª Classe (ES1)
  // ══════════════════════════════════════════════════════════
  { id:'ao7mat-1-1', subjectId:'ao7-mat',  title:'Números Inteiros e Operações',      description:'Adição, subtração, multiplicação e divisão de inteiros',   term:1, displayOrder:1 },
  { id:'ao7mat-1-2', subjectId:'ao7-mat',  title:'Fracções e Números Decimais',        description:'Simplificação, operações e conversões',                   term:1, displayOrder:2 },
  { id:'ao7mat-2-1', subjectId:'ao7-mat',  title:'Equações do 1º Grau',               description:'Resolução de equações simples e problemas',               term:2, displayOrder:3 },
  { id:'ao7mat-2-2', subjectId:'ao7-mat',  title:'Proporcionalidade',                 description:'Razão, proporção e regra de três',                        term:2, displayOrder:4 },
  { id:'ao7mat-3-1', subjectId:'ao7-mat',  title:'Geometria Plana — Polígonos',       description:'Triângulos, quadriláteros e suas propriedades',           term:3, displayOrder:5 },
  { id:'ao7mat-3-2', subjectId:'ao7-mat',  title:'Perímetro e Área',                  description:'Cálculo de áreas de figuras geométricas',                 term:3, displayOrder:6 },

  { id:'ao7por-1-1', subjectId:'ao7-port', title:'Comunicação Oral e Escrita',        description:'Tipos de texto e intenção comunicativa',                  term:1, displayOrder:1 },
  { id:'ao7por-1-2', subjectId:'ao7-port', title:'Classes de Palavras',               description:'Substantivo, adjectivo, verbo e advérbio',               term:1, displayOrder:2 },
  { id:'ao7por-2-1', subjectId:'ao7-port', title:'Sintaxe Básica',                    description:'Sujeito, predicado e complementos',                       term:2, displayOrder:3 },
  { id:'ao7por-2-2', subjectId:'ao7-port', title:'Texto Narrativo',                   description:'Estrutura do conto e análise de personagens',             term:2, displayOrder:4 },
  { id:'ao7por-3-1', subjectId:'ao7-port', title:'Produção Escrita',                  description:'Narração e descrição com coerência',                      term:3, displayOrder:5 },

  { id:'ao7cf-1-1',  subjectId:'ao7-fis',  title:'Matéria e suas Propriedades',       description:'Estados físicos e mudanças de estado',                    term:1, displayOrder:1 },
  { id:'ao7cf-1-2',  subjectId:'ao7-fis',  title:'Energia e Transformações',          description:'Formas de energia e conversões',                          term:1, displayOrder:2 },
  { id:'ao7cf-2-1',  subjectId:'ao7-fis',  title:'Noções de Química',                 description:'Elementos, compostos e misturas',                         term:2, displayOrder:3 },
  { id:'ao7cf-3-1',  subjectId:'ao7-fis',  title:'Força e Movimento',                 description:'Noções de mecânica e atrito',                             term:3, displayOrder:4 },

  { id:'ao7nat-1-1', subjectId:'ao7-nat',  title:'Seres Vivos e Classificação',       description:'Reinos, características dos seres vivos',                 term:1, displayOrder:1 },
  { id:'ao7nat-2-1', subjectId:'ao7-nat',  title:'Ecossistemas Angolanos',            description:'Savana, floresta e ecologia local',                       term:2, displayOrder:2 },
  { id:'ao7nat-3-1', subjectId:'ao7-nat',  title:'Saúde e Doenças Comuns em Angola',  description:'Malária, cólera, HIV — prevenção',                        term:3, displayOrder:3 },

  { id:'ao7his-1-1', subjectId:'ao7-his',  title:'Pré-História',                      description:'Povos primitivos e evolução humana',                      term:1, displayOrder:1 },
  { id:'ao7his-2-1', subjectId:'ao7-his',  title:'Civilizações Antigas',              description:'Egipto, Mesopotâmia e Grécia',                            term:2, displayOrder:2 },
  { id:'ao7his-3-1', subjectId:'ao7-his',  title:'Reinos Africanos',                  description:'Reino do Congo, Ndongo e Matamba',                        term:3, displayOrder:3 },

  // ══════════════════════════════════════════════════════════
  //  ANGOLA — 8ª Classe (ES1)
  // ══════════════════════════════════════════════════════════
  { id:'ao8mat-1-1', subjectId:'ao8-mat',  title:'Álgebra — Expressões Algébricas',   description:'Simplificação e operações com polinómios',                term:1, displayOrder:1 },
  { id:'ao8mat-1-2', subjectId:'ao8-mat',  title:'Equações do 2º Grau',               description:'Fórmula resolvente e problemas',                          term:1, displayOrder:2 },
  { id:'ao8mat-2-1', subjectId:'ao8-mat',  title:'Sistemas de Equações',              description:'Métodos de substituição e eliminação',                    term:2, displayOrder:3 },
  { id:'ao8mat-2-2', subjectId:'ao8-mat',  title:'Geometria — Teorema de Pitágoras',  description:'Triângulo rectângulo e aplicações',                       term:2, displayOrder:4 },
  { id:'ao8mat-3-1', subjectId:'ao8-mat',  title:'Estatística Básica',                description:'Média, moda, mediana e gráficos',                         term:3, displayOrder:5 },
  { id:'ao8mat-3-2', subjectId:'ao8-mat',  title:'Probabilidade',                     description:'Eventos, espaço amostral e probabilidade simples',        term:3, displayOrder:6 },

  { id:'ao8por-1-1', subjectId:'ao8-port', title:'Texto Informativo e Científico',    description:'Relatório, notícia e artigo de opinião',                  term:1, displayOrder:1 },
  { id:'ao8por-1-2', subjectId:'ao8-port', title:'Gramática — Morfossintaxe',         description:'Concordância nominal e verbal',                           term:1, displayOrder:2 },
  { id:'ao8por-2-1', subjectId:'ao8-port', title:'Literatura Africana de Língua Port',description:'Contos e poemas de autores africanos',                    term:2, displayOrder:3 },
  { id:'ao8por-3-1', subjectId:'ao8-port', title:'Produção de Texto Argumentativo',   description:'Tese, argumentos e contra-argumentos',                    term:3, displayOrder:4 },

  { id:'ao8cf-1-1',  subjectId:'ao8-fis',  title:'Calor e Temperatura',               description:'Termometria, dilatação e condução de calor',              term:1, displayOrder:1 },
  { id:'ao8cf-2-1',  subjectId:'ao8-fis',  title:'Energia Eléctrica',                 description:'Circuitos simples e lei de Ohm',                          term:2, displayOrder:2 },
  { id:'ao8cf-3-1',  subjectId:'ao8-fis',  title:'Reacções Químicas',                 description:'Tipos de reacções e balanceamento',                       term:3, displayOrder:3 },

  { id:'ao8nat-1-1', subjectId:'ao8-nat',  title:'Célula e Divisão Celular',          description:'Mitose, meiose e ciclo celular',                          term:1, displayOrder:1 },
  { id:'ao8nat-2-1', subjectId:'ao8-nat',  title:'Reprodução Humana',                 description:'Sistema reprodutor e puberdade',                          term:2, displayOrder:2 },
  { id:'ao8nat-3-1', subjectId:'ao8-nat',  title:'Genética Básica',                   description:'Hereditariedade e leis de Mendel',                        term:3, displayOrder:3 },

  { id:'ao8his-1-1', subjectId:'ao8-his',  title:'Expansão Europeia e África',        description:'Navegações e contacto com reinos africanos',              term:1, displayOrder:1 },
  { id:'ao8his-2-1', subjectId:'ao8-his',  title:'Tráfico Negreiro',                  description:'Impacto em Angola e resistência dos povos',                term:2, displayOrder:2 },
  { id:'ao8his-3-1', subjectId:'ao8-his',  title:'Revoluções dos Séculos XVIII-XIX',  description:'Americana, Francesa e Industrial',                        term:3, displayOrder:3 },

  // ══════════════════════════════════════════════════════════
  //  ANGOLA — 9ª Classe (ES1)
  // ══════════════════════════════════════════════════════════
  { id:'ao9mat-1-1', subjectId:'ao9-mat',  title:'Funções — Conceitos Fundamentais',  description:'Domínio, imagem e representação gráfica',                 term:1, displayOrder:1 },
  { id:'ao9mat-1-2', subjectId:'ao9-mat',  title:'Função Afim e Quadrática',          description:'Gráficos, raízes e vértice',                              term:1, displayOrder:2 },
  { id:'ao9mat-2-1', subjectId:'ao9-mat',  title:'Trigonometria no Triângulo',        description:'Seno, cosseno, tangente — aplicações',                    term:2, displayOrder:3 },
  { id:'ao9mat-2-2', subjectId:'ao9-mat',  title:'Números Reais e Irracionalidade',   description:'Raiz quadrada, potências e logaritmos',                   term:2, displayOrder:4 },
  { id:'ao9mat-3-1', subjectId:'ao9-mat',  title:'Estatística e Probabilidade',       description:'Frequências, histogramas e combinatória básica',           term:3, displayOrder:5 },

  { id:'ao9por-1-1', subjectId:'ao9-port', title:'Literatura Angolana — Poesia',      description:'Agostinho Neto e a geração da resistência',               term:1, displayOrder:1 },
  { id:'ao9por-1-2', subjectId:'ao9-port', title:'Literatura Angolana — Prosa',       description:'Luandino Vieira e Pepetela',                              term:1, displayOrder:2 },
  { id:'ao9por-2-1', subjectId:'ao9-port', title:'Gramática — Sintaxe Avançada',      description:'Orações subordinadas e coordenadas',                      term:2, displayOrder:3 },
  { id:'ao9por-3-1', subjectId:'ao9-port', title:'Produção Textual — Dissertação',    description:'Argumentação e proposta de solução',                      term:3, displayOrder:4 },

  { id:'ao9cf-1-1',  subjectId:'ao9-fis',  title:'Electricidade e Circuitos',         description:'Corrente, tensão, resistência e potência',                term:1, displayOrder:1 },
  { id:'ao9cf-2-1',  subjectId:'ao9-fis',  title:'Magnetismo e Electromagnetismo',    description:'Campos magnéticos e indução electromagnética',            term:2, displayOrder:2 },
  { id:'ao9cf-3-1',  subjectId:'ao9-fis',  title:'Óptica Básica',                     description:'Reflexão, refracção e formação de imagens',               term:3, displayOrder:3 },

  { id:'ao9nat-1-1', subjectId:'ao9-nat',  title:'Corpo Humano — Sistemas',           description:'Sistema nervoso, circulatório e imunitário',              term:1, displayOrder:1 },
  { id:'ao9nat-2-1', subjectId:'ao9-nat',  title:'Ecologia e Ambiente',               description:'Cadeias alimentares e impacto ambiental em Angola',      term:2, displayOrder:2 },
  { id:'ao9nat-3-1', subjectId:'ao9-nat',  title:'Biotecnologia e Saúde',             description:'OGM, vacinação e saúde pública',                          term:3, displayOrder:3 },

  { id:'ao9his-1-1', subjectId:'ao9-his',  title:'Colonialismo em Angola',            description:'Administração colonial portuguesa e resistência',          term:1, displayOrder:1 },
  { id:'ao9his-2-1', subjectId:'ao9-his',  title:'Movimentos de Independência',       description:'MPLA, FNLA, UNITA e a luta armada',                       term:2, displayOrder:2 },
  { id:'ao9his-3-1', subjectId:'ao9-his',  title:'Angola Independente',               description:'11 de Novembro de 1975 e construção nacional',            term:3, displayOrder:3 },

  // ══════════════════════════════════════════════════════════
  //  ANGOLA — 11ª Classe (ES2) — Capítulos
  // ══════════════════════════════════════════════════════════
  { id:'ao11mat-1-1', subjectId:'ao11-mat', title:'Álgebra Linear — Matrizes',        description:'Operações com matrizes e determinantes',                  term:1, displayOrder:1 },
  { id:'ao11mat-1-2', subjectId:'ao11-mat', title:'Sistemas Lineares',                description:'Método de Gauss e discussão de sistemas',                 term:1, displayOrder:2 },
  { id:'ao11mat-2-1', subjectId:'ao11-mat', title:'Cálculo Diferencial — Derivadas',  description:'Definição, regras de derivação e aplicações',             term:2, displayOrder:3 },
  { id:'ao11mat-2-2', subjectId:'ao11-mat', title:'Máximos e Mínimos',                description:'Estudo de funções com derivadas',                         term:2, displayOrder:4 },
  { id:'ao11mat-3-1', subjectId:'ao11-mat', title:'Integral Indefinida',              description:'Primitivação e regras de integração',                     term:3, displayOrder:5 },
  { id:'ao11mat-3-2', subjectId:'ao11-mat', title:'Integral Definida e Áreas',        description:'Teorema fundamental do cálculo e aplicações',             term:3, displayOrder:6 },

  { id:'ao11por-1-1', subjectId:'ao11-port', title:'Produção Textual Avançada',       description:'Dissertação, análise crítica e argumentação',             term:1, displayOrder:1 },
  { id:'ao11por-1-2', subjectId:'ao11-port', title:'Literatura Africana Lusófona',    description:'Mia Couto, José Saramago e Ondjaki',                      term:1, displayOrder:2 },
  { id:'ao11por-2-1', subjectId:'ao11-port', title:'Gramática — Semântica e Estilística',description:'Figuras de estilo e análise do discurso',             term:2, displayOrder:3 },
  { id:'ao11por-3-1', subjectId:'ao11-port', title:'Literatura Portuguesa — Modernismo',description:'Fernando Pessoa e heterónimos',                        term:3, displayOrder:4 },

  { id:'ao11fis-1-1', subjectId:'ao11-fis', title:'Electromagnetismo',                description:'Lei de Coulomb, campo eléctrico e lei de Gauss',          term:1, displayOrder:1 },
  { id:'ao11fis-1-2', subjectId:'ao11-fis', title:'Corrente Alternada e Circuitos AC',description:'Impedância, ressonância e potência',                     term:1, displayOrder:2 },
  { id:'ao11fis-2-1', subjectId:'ao11-fis', title:'Óptica Ondulatória',               description:'Interferência, difracção e polarização',                  term:2, displayOrder:3 },
  { id:'ao11fis-3-1', subjectId:'ao11-fis', title:'Física Moderna — Introdução',      description:'Relatividade restrita e efeito fotoeléctrico',            term:3, displayOrder:4 },

  { id:'ao11qui-1-1', subjectId:'ao11-qui', title:'Cinética Química',                 description:'Velocidade de reacção e catálise',                        term:1, displayOrder:1 },
  { id:'ao11qui-2-1', subjectId:'ao11-qui', title:'Equilíbrio Químico',               description:'Princípio de Le Chatelier e Kc/Kp',                       term:2, displayOrder:2 },
  { id:'ao11qui-3-1', subjectId:'ao11-qui', title:'Química Orgânica — Hidrocarbonetos',description:'Alcanos, alcenos e alcinos',                            term:3, displayOrder:3 },
  { id:'ao11qui-3-2', subjectId:'ao11-qui', title:'Funções Orgânicas',                description:'Álcoois, ácidos carboxílicos e ésteres',                  term:3, displayOrder:4 },

  { id:'ao11bio-1-1', subjectId:'ao11-bio', title:'Genética Molecular',               description:'DNA, replicação, transcrição e tradução',                 term:1, displayOrder:1 },
  { id:'ao11bio-2-1', subjectId:'ao11-bio', title:'Genética de Populações',           description:'Hardy-Weinberg e evolução',                               term:2, displayOrder:2 },
  { id:'ao11bio-3-1', subjectId:'ao11-bio', title:'Evolução e Especiação',            description:'Selecção natural, deriva e especiação',                   term:3, displayOrder:3 },

  // ══════════════════════════════════════════════════════════
  //  ANGOLA — 12ª Classe (ES2) — Capítulos
  // ══════════════════════════════════════════════════════════
  { id:'ao12mat-1-1', subjectId:'ao12-mat', title:'Combinatória',                     description:'Permutações, arranjos e combinações',                     term:1, displayOrder:1 },
  { id:'ao12mat-1-2', subjectId:'ao12-mat', title:'Probabilidade — Eventos Compostos',description:'Teorema de Bayes e variáveis aleatórias',                 term:1, displayOrder:2 },
  { id:'ao12mat-2-1', subjectId:'ao12-mat', title:'Estatística Inferencial',          description:'Distribuições, intervalos de confiança',                  term:2, displayOrder:3 },
  { id:'ao12mat-2-2', subjectId:'ao12-mat', title:'Números Complexos',                description:'Forma algébrica, trigonométrica e operações',             term:2, displayOrder:4 },
  { id:'ao12mat-3-1', subjectId:'ao12-mat', title:'Revisão para Exame Nacional',      description:'Tópicos prioritários e exercícios resolvidos',             term:3, displayOrder:5 },

  { id:'ao12por-1-1', subjectId:'ao12-port', title:'Análise Literária Aprofundada',   description:'Épica, lírica e dramática na literatura de língua port.',  term:1, displayOrder:1 },
  { id:'ao12por-2-1', subjectId:'ao12-port', title:'Argumentação e Retórica',         description:'Lógica do argumento e falácias',                          term:2, displayOrder:2 },
  { id:'ao12por-3-1', subjectId:'ao12-port', title:'Preparação para Exame',           description:'Redação, análise e interpretação de textos',              term:3, displayOrder:3 },

  { id:'ao12fis-1-1', subjectId:'ao12-fis', title:'Física Atómica',                   description:'Modelo atómico de Bohr, espectros e quantização',         term:1, displayOrder:1 },
  { id:'ao12fis-2-1', subjectId:'ao12-fis', title:'Física Nuclear',                   description:'Radioactividade, fusão e fissão nuclear',                 term:2, displayOrder:2 },
  { id:'ao12fis-3-1', subjectId:'ao12-fis', title:'Relatividade Especial',            description:'Dilatação do tempo e equivalência massa-energia',         term:3, displayOrder:3 },

  { id:'ao12qui-1-1', subjectId:'ao12-qui', title:'Química Ambiental',                description:'Poluição, efeito estufa e química verde',                 term:1, displayOrder:1 },
  { id:'ao12qui-2-1', subjectId:'ao12-qui', title:'Electroquímica',                   description:'Pilhas, electrólise e corrosão',                          term:2, displayOrder:2 },
  { id:'ao12qui-3-1', subjectId:'ao12-qui', title:'Química Industrial',               description:'Indústria petroquímica e processos angolanos',             term:3, displayOrder:3 },

  { id:'ao12bio-1-1', subjectId:'ao12-bio', title:'Microbiologia',                    description:'Vírus, bactérias e protistas — doenças tropicais',        term:1, displayOrder:1 },
  { id:'ao12bio-2-1', subjectId:'ao12-bio', title:'Imunologia',                       description:'Sistema imunitário, vacinas e autoimunidade',             term:2, displayOrder:2 },
  { id:'ao12bio-3-1', subjectId:'ao12-bio', title:'Biotecnologia',                    description:'OGM, CRISPR e aplicações em Angola',                      term:3, displayOrder:3 },

  // ══════════════════════════════════════════════════════════
  //  BRASIL 1º Ano Ensino Médio
  // ══════════════════════════════════════════════════════════
  { id:'br1em-mat-1', subjectId:'br1em-mat', title:'Conjuntos e Lógica',                  description:'Teoria dos conjuntos, operações e lógica proposicional',          term:1, displayOrder:1 },
  { id:'br1em-mat-2', subjectId:'br1em-mat', title:'Funções do 1º e 2º Grau',             description:'Domínio, gráfico e aplicações',                                   term:1, displayOrder:2 },
  { id:'br1em-mat-3', subjectId:'br1em-mat', title:'Função Exponencial e Logarítmica',    description:'Propriedades e gráficos',                                         term:2, displayOrder:3 },
  { id:'br1em-mat-4', subjectId:'br1em-mat', title:'Trigonometria no Triângulo Rectângulo', description:'Seno, cosseno, tangente e aplicações',                          term:2, displayOrder:4 },
  { id:'br1em-mat-5', subjectId:'br1em-mat', title:'Sequências e Progressões',            description:'PA, PG e problemas de vestibular',                                term:3, displayOrder:5 },
  { id:'br1em-mat-6', subjectId:'br1em-mat', title:'Geometria Plana',                     description:'Polígonos, áreas e perímetros',                                   term:4, displayOrder:6 },

  { id:'br1em-por-1', subjectId:'br1em-por', title:'Trovadorismo e Humanismo',            description:'Literatura medieval portuguesa',                                   term:1, displayOrder:1 },
  { id:'br1em-por-2', subjectId:'br1em-por', title:'Classicismo — Camões',                description:'Os Lusíadas e lírica camoniana',                                  term:1, displayOrder:2 },
  { id:'br1em-por-3', subjectId:'br1em-por', title:'Barroco e Arcadismo',                 description:'Padre António Vieira e Tomás António Gonzaga',                    term:2, displayOrder:3 },
  { id:'br1em-por-4', subjectId:'br1em-por', title:'Romantismo Brasileiro',               description:'Indianismo, sertanismo e condoreirismo',                          term:2, displayOrder:4 },
  { id:'br1em-por-5', subjectId:'br1em-por', title:'Gramática — Morfologia',              description:'Classes gramaticais e flexões',                                   term:3, displayOrder:5 },
  { id:'br1em-por-6', subjectId:'br1em-por', title:'Redação — Dissertação Argumentativa', description:'Estrutura, tese, argumentos e proposta de intervenção',           term:4, displayOrder:6 },

  { id:'br1em-fis-1', subjectId:'br1em-fis', title:'Cinemática Escalar',                  description:'Posição, velocidade e aceleração',                                term:1, displayOrder:1 },
  { id:'br1em-fis-2', subjectId:'br1em-fis', title:'Cinemática Vectorial',                description:'Movimento oblíquo e circular',                                    term:1, displayOrder:2 },
  { id:'br1em-fis-3', subjectId:'br1em-fis', title:'Dinâmica — Leis de Newton',           description:'Peso, normal, atrito e força resultante',                         term:2, displayOrder:3 },
  { id:'br1em-fis-4', subjectId:'br1em-fis', title:'Trabalho e Energia',                  description:'Potência, energia mecânica e conservação',                        term:2, displayOrder:4 },
  { id:'br1em-fis-5', subjectId:'br1em-fis', title:'Gravitação Universal',                description:'Lei de Newton, órbitas e satélites',                              term:3, displayOrder:5 },
  { id:'br1em-fis-6', subjectId:'br1em-fis', title:'Hidrostática e Hidrodinâmica',        description:'Pressão, Arquimedes e Bernoulli',                                 term:4, displayOrder:6 },

  { id:'br1em-qui-1', subjectId:'br1em-qui', title:'Estrutura da Matéria',                description:'Átomos, modelos atómicos e número quântico',                      term:1, displayOrder:1 },
  { id:'br1em-qui-2', subjectId:'br1em-qui', title:'Tabela Periódica',                    description:'Grupos, períodos e propriedades',                                 term:1, displayOrder:2 },
  { id:'br1em-qui-3', subjectId:'br1em-qui', title:'Ligações Químicas',                   description:'Iônica, covalente, metálica e geometria molecular',               term:2, displayOrder:3 },
  { id:'br1em-qui-4', subjectId:'br1em-qui', title:'Funções Inorgânicas',                 description:'Ácidos, bases, sais e óxidos — Arrhenius e Brønsted',             term:2, displayOrder:4 },
  { id:'br1em-qui-5', subjectId:'br1em-qui', title:'Reacções Químicas e Balanceamento',   description:'Tipos de reacções e balanceamento por oxidação',                  term:3, displayOrder:5 },
  { id:'br1em-qui-6', subjectId:'br1em-qui', title:'Estequiometria',                      description:'Mol, molaridade, rendimento e pureza',                            term:4, displayOrder:6 },

  { id:'br1em-bio-1', subjectId:'br1em-bio', title:'Origem da Vida',                      description:'Teorias sobre a origem da vida na Terra',                         term:1, displayOrder:1 },
  { id:'br1em-bio-2', subjectId:'br1em-bio', title:'Citologia',                           description:'Estrutura celular procariótica e eucariótica',                    term:1, displayOrder:2 },
  { id:'br1em-bio-3', subjectId:'br1em-bio', title:'Histologia',                          description:'Tecidos epitelial, conjuntivo, muscular e nervoso',               term:2, displayOrder:3 },
  { id:'br1em-bio-4', subjectId:'br1em-bio', title:'Embriologia',                         description:'Fecundação, segmentação e gastrulação',                           term:2, displayOrder:4 },
  { id:'br1em-bio-5', subjectId:'br1em-bio', title:'Classificação dos Seres Vivos',       description:'Reinos Monera, Protista, Fungi, Plantae e Animalia',              term:3, displayOrder:5 },
  { id:'br1em-bio-6', subjectId:'br1em-bio', title:'Ecologia',                            description:'Ecossistemas, cadeias alimentares e ciclos biogeoquímicos',       term:4, displayOrder:6 },

  // ══════════════════════════════════════════════════════════
  //  BRASIL 2º Ano Ensino Médio
  // ══════════════════════════════════════════════════════════
  { id:'br2em-mat-1', subjectId:'br2em-mat', title:'Geometria Plana Avançada',             description:'Triângulos, círculos e polígonos regulares',                      term:1, displayOrder:1 },
  { id:'br2em-mat-2', subjectId:'br2em-mat', title:'Geometria Espacial',                  description:'Prismas, pirâmides, cilindros, cones e esferas',                  term:2, displayOrder:2 },
  { id:'br2em-mat-3', subjectId:'br2em-mat', title:'Análise Combinatória',                description:'Princípio multiplicativo, permutações, arranjos e combinações',    term:3, displayOrder:3 },
  { id:'br2em-mat-4', subjectId:'br2em-mat', title:'Probabilidade',                       description:'Probabilidade clássica, condicional e independência',              term:4, displayOrder:4 },

  { id:'br2em-por-1', subjectId:'br2em-por', title:'Realismo e Naturalismo',              description:'Machado de Assis, Eça de Queirós e o Realismo brasileiro',        term:1, displayOrder:1 },
  { id:'br2em-por-2', subjectId:'br2em-por', title:'Parnasianismo e Simbolismo',          description:'Olavo Bilac e Cruz e Sousa',                                      term:2, displayOrder:2 },
  { id:'br2em-por-3', subjectId:'br2em-por', title:'Pré-Modernismo e 1ª Fase Modernista', description:'Semana de Arte Moderna 1922',                                     term:3, displayOrder:3 },
  { id:'br2em-por-4', subjectId:'br2em-por', title:'Gramática — Sintaxe',                description:'Sujeito, predicado, complementos e adjuntos',                     term:4, displayOrder:4 },

  { id:'br2em-fis-1', subjectId:'br2em-fis', title:'Termodinâmica',                       description:'Temperatura, calor, dilatação e calorimetria',                    term:1, displayOrder:1 },
  { id:'br2em-fis-2', subjectId:'br2em-fis', title:'Leis da Termodinâmica',               description:'0ª, 1ª, 2ª e 3ª Leis e máquinas térmicas',                       term:2, displayOrder:2 },
  { id:'br2em-fis-3', subjectId:'br2em-fis', title:'Ondulatória',                         description:'Propriedades das ondas, acústica e ultrasom',                     term:3, displayOrder:3 },
  { id:'br2em-fis-4', subjectId:'br2em-fis', title:'Óptica',                              description:'Reflexão, refracção, espelhos e lentes',                          term:4, displayOrder:4 },

  // ══════════════════════════════════════════════════════════
  //  BRASIL 3º Ano Ensino Médio
  // ══════════════════════════════════════════════════════════
  { id:'br3em-mat-1', subjectId:'br3em-mat', title:'Matrizes e Determinantes',             description:'Operações, inversa e regra de Cramer',                            term:1, displayOrder:1 },
  { id:'br3em-mat-2', subjectId:'br3em-mat', title:'Geometria Analítica',                 description:'Retas, distâncias, cônicas',                                      term:2, displayOrder:2 },
  { id:'br3em-mat-3', subjectId:'br3em-mat', title:'Trigonometria no Círculo Unitário',   description:'Arco, radiano, equações trigonométricas',                         term:3, displayOrder:3 },
  { id:'br3em-mat-4', subjectId:'br3em-mat', title:'Revisão ENEM e Vestibulares',         description:'Todos os conteúdos com exercícios resolvidos do ENEM',            term:4, displayOrder:4 },

  { id:'br3em-por-1', subjectId:'br3em-por', title:'2ª e 3ª Fases do Modernismo',        description:'Drummond, Guimarães Rosa e João Cabral',                          term:1, displayOrder:1 },
  { id:'br3em-por-2', subjectId:'br3em-por', title:'Pós-Modernismo Brasileiro',           description:'Clarice Lispector e autores contemporâneos',                      term:2, displayOrder:2 },
  { id:'br3em-por-3', subjectId:'br3em-por', title:'Redação ENEM — Simulados',            description:'Proposta de intervenção e textos motivadores',                    term:3, displayOrder:3 },
  { id:'br3em-por-4', subjectId:'br3em-por', title:'Análise Linguística e Variação',      description:'Variação dialectal, registro e desvios da norma',                 term:4, displayOrder:4 },

  { id:'br3em-fis-1', subjectId:'br3em-fis', title:'Electrostática',                      description:'Carga, campo e potencial eléctrico',                              term:1, displayOrder:1 },
  { id:'br3em-fis-2', subjectId:'br3em-fis', title:'Electrodynamica e Circuitos',         description:'Corrente, resistência, lei de Ohm e circuitos',                   term:2, displayOrder:2 },
  { id:'br3em-fis-3', subjectId:'br3em-fis', title:'Electromagnetismo',                   description:'Campo magnético, indução e ondas EM',                             term:3, displayOrder:3 },
  { id:'br3em-fis-4', subjectId:'br3em-fis', title:'Física Moderna e Nuclear',            description:'Relatividade, efeito fotoelétrico e radioactividade',             term:4, displayOrder:4 },

  // ══════════════════════════════════════════════════════════
  //  PORTUGAL 10º Ano
  // ══════════════════════════════════════════════════════════
  { id:'pt10mat-1-1', subjectId:'pt10-mat', title:'Funções e Gráficos',                   description:'Função real de variável real, monotonia e paridade',              term:1, displayOrder:1 },
  { id:'pt10mat-1-2', subjectId:'pt10-mat', title:'Trigonometria e Funções Trigonométricas', description:'Círculo trigonométrico, seno e cosseno',                       term:1, displayOrder:2 },
  { id:'pt10mat-2-1', subjectId:'pt10-mat', title:'Geometria no Plano — Vectores',        description:'Vectores, produto escalar e transformações',                      term:2, displayOrder:3 },
  { id:'pt10mat-2-2', subjectId:'pt10-mat', title:'Probabilidade',                        description:'Probabilidade clássica e laplaciana',                             term:2, displayOrder:4 },
  { id:'pt10mat-3-1', subjectId:'pt10-mat', title:'Crescimentos e Exponenciais',           description:'Função exponencial, logarítmica e aplicações',                    term:3, displayOrder:5 },

  { id:'pt10por-1-1', subjectId:'pt10-port', title:'Épica — Os Lusíadas',                'description':'Análise estrutural e temática dos Lusíadas de Camões',           term:1, displayOrder:1 },
  { id:'pt10por-1-2', subjectId:'pt10-port', title:'Lírica Camoniana',                   description:'Sonetos e redondilhas de Luís de Camões',                         term:1, displayOrder:2 },
  { id:'pt10por-2-1', subjectId:'pt10-port', title:'Conto — Contos Tradicionais e Modernos', description:'Análise do conto literário português',                         term:2, displayOrder:3 },
  { id:'pt10por-2-2', subjectId:'pt10-port', title:'Texto Expositivo-Argumentativo',      description:'Estrutura e estratégias de argumentação',                         term:2, displayOrder:4 },
  { id:'pt10por-3-1', subjectId:'pt10-port', title:'Poesia do Século XX',                 description:'Pessoa, Sá-Carneiro e a geração de Orfeu',                        term:3, displayOrder:5 },
  { id:'pt10por-3-2', subjectId:'pt10-port', title:'Gramática — Semântica e Pragmática', description:'Significado, contexto e actos de fala',                           term:3, displayOrder:6 },

  { id:'pt10fq-1-1',  subjectId:'pt10-fis', title:'Física — Cinemática',                 description:'Movimento rectilíneo, vectores e equações',                       term:1, displayOrder:1 },
  { id:'pt10fq-1-2',  subjectId:'pt10-fis', title:'Física — Forças e Dinâmica',          description:'Leis de Newton e equilíbrio',                                     term:1, displayOrder:2 },
  { id:'pt10fq-2-1',  subjectId:'pt10-fis', title:'Química — Classificação dos Materiais', description:'Estados da matéria, misturas e substâncias',                    term:2, displayOrder:3 },
  { id:'pt10fq-2-2',  subjectId:'pt10-fis', title:'Química — Estrutura Atómica',         description:'Modelos atómicos e tabela periódica',                             term:2, displayOrder:4 },
  { id:'pt10fq-3-1',  subjectId:'pt10-fis', title:'Física — Energia',                    description:'Formas de energia, trabalho e potência',                          term:3, displayOrder:5 },
  { id:'pt10fq-3-2',  subjectId:'pt10-fis', title:'Química — Ligações e Reacções',       description:'Ligações químicas e tipos de reacções',                           term:3, displayOrder:6 },

  { id:'pt10bg-1-1',  subjectId:'pt10-bio', title:'Células e Energia',                   description:'Fotossíntese, respiração e ATP',                                  term:1, displayOrder:1 },
  { id:'pt10bg-1-2',  subjectId:'pt10-bio', title:'Reprodução e Hereditariedade',        description:'Mitose, meiose e padrões hereditários',                           term:1, displayOrder:2 },
  { id:'pt10bg-2-1',  subjectId:'pt10-bio', title:'Geologia — Rochas e Minerais',        description:'Tipos de rochas, ciclo das rochas e minerais',                    term:2, displayOrder:3 },
  { id:'pt10bg-2-2',  subjectId:'pt10-bio', title:'Tectónica de Placas',                 description:'Deriva continental, sismos e vulcanismo',                         term:2, displayOrder:4 },
  { id:'pt10bg-3-1',  subjectId:'pt10-bio', title:'Dinâmica Interna da Terra',           description:'Estrutura interna, geoide e geomorfologia',                       term:3, displayOrder:5 },

  // ══════════════════════════════════════════════════════════
  //  PORTUGAL 11º Ano
  // ══════════════════════════════════════════════════════════
  { id:'pt11mat-1-1', subjectId:'pt11-mat', title:'Sucessões e Limites',                  description:'Sucessões numéricas, limite e teorema de Bolzano',                term:1, displayOrder:1 },
  { id:'pt11mat-2-1', subjectId:'pt11-mat', title:'Derivadas',                            description:'Definição, regras e aplicações ao estudo de funções',             term:2, displayOrder:2 },
  { id:'pt11mat-3-1', subjectId:'pt11-mat', title:'Análise Combinatória e Probabilidade', description:'Combinatória, distribuição binomial e normal',                    term:3, displayOrder:3 },

  { id:'pt11por-1-1', subjectId:'pt11-port', title:'Poesia Simbolista — Cesário Verde',  description:'Análise de "O Sentimento dum Ocidental"',                         term:1, displayOrder:1 },
  { id:'pt11por-1-2', subjectId:'pt11-port', title:'Mensagem de Fernando Pessoa',        description:'Análise temática e simbólica da Mensagem',                        term:1, displayOrder:2 },
  { id:'pt11por-2-1', subjectId:'pt11-port', title:'Heterónimos Pessoanos',              description:'Caeiro, Campos, Reis e Bernardo Soares',                          term:2, displayOrder:3 },
  { id:'pt11por-3-1', subjectId:'pt11-port', title:'Texto Dramático — Gil Vicente',      description:'Auto da Barca do Inferno e Farsa de Inês Pereira',                term:3, displayOrder:4 },

  // ══════════════════════════════════════════════════════════
  //  PORTUGAL 12º Ano
  // ══════════════════════════════════════════════════════════
  { id:'pt12mat-1-1', subjectId:'pt12-mat', title:'Integral e Cálculo de Áreas',         description:'Primitivas, integral definido e áreas entre curvas',              term:1, displayOrder:1 },
  { id:'pt12mat-2-1', subjectId:'pt12-mat', title:'Probabilidades e Estatística Inf.',   description:'Intervalos de confiança e testes de hipótese',                    term:2, displayOrder:2 },
  { id:'pt12mat-3-1', subjectId:'pt12-mat', title:'Preparação para Exame Nacional',      description:'Exames dos anos anteriores e resolução comentada',                term:3, displayOrder:3 },

  { id:'pt12por-1-1', subjectId:'pt12-port', title:'Eça de Queirós — Os Maias',         description:'Análise do romance e crítica social',                             term:1, displayOrder:1 },
  { id:'pt12por-2-1', subjectId:'pt12-port', title:'Álvaro de Campos e Pessoa Ortónimo', description:'Odes e poesia do início do séc. XX',                             term:2, displayOrder:2 },
  { id:'pt12por-3-1', subjectId:'pt12-port', title:'Preparação para Exame Nacional',     description:'Tipologias textuais e resolução de exames',                       term:3, displayOrder:3 },

  // ══════════════════════════════════════════════════════════
  //  CABO VERDE 10º Ano
  // ══════════════════════════════════════════════════════════
  { id:'cv10mat-1-1', subjectId:'cv10-mat', title:'Funções e Gráficos',                  description:'Domínio, imagem, injectividade e bijectividade',                  term:1, displayOrder:1 },
  { id:'cv10mat-1-2', subjectId:'cv10-mat', title:'Equações e Inequações',               description:'1º e 2º grau e sistemas',                                         term:1, displayOrder:2 },
  { id:'cv10mat-2-1', subjectId:'cv10-mat', title:'Trigonometria',                       description:'Círculo trigonométrico e relações fundamentais',                   term:2, displayOrder:3 },
  { id:'cv10mat-2-2', subjectId:'cv10-mat', title:'Logaritmos e Exponenciais',           description:'Propriedades e aplicações',                                        term:2, displayOrder:4 },
  { id:'cv10mat-3-1', subjectId:'cv10-mat', title:'Geometria Analítica',                 description:'Recta, circunferência e distâncias',                              term:3, displayOrder:5 },
  { id:'cv10mat-3-2', subjectId:'cv10-mat', title:'Estatística e Probabilidade',         description:'Médias, desvio padrão e probabilidade clássica',                  term:3, displayOrder:6 },

  { id:'cv10por-1-1', subjectId:'cv10-port', title:'Literatura Cabo-Verdiana — Claridade', description:'Movimento Claridoso e identidade cultural',                    term:1, displayOrder:1 },
  { id:'cv10por-1-2', subjectId:'cv10-port', title:'Gramática — Morfologia',             description:'Classes de palavras e processos de formação',                    term:1, displayOrder:2 },
  { id:'cv10por-2-1', subjectId:'cv10-port', title:'Literatura Portuguesa — Realismo',   description:'Eça de Queirós e o romance realista',                            term:2, displayOrder:3 },
  { id:'cv10por-2-2', subjectId:'cv10-port', title:'Texto Narrativo',                    description:'Conto, novela e romance — análise estrutural',                    term:2, displayOrder:4 },
  { id:'cv10por-3-1', subjectId:'cv10-port', title:'Produção de Texto',                  description:'Carta, relatório, artigo de opinião',                            term:3, displayOrder:5 },
  { id:'cv10por-3-2', subjectId:'cv10-port', title:'Modernismo e Literatura Africana',   description:'PALOP — Poesia e prosa dos países africanos',                    term:3, displayOrder:6 },

  { id:'cv10fis-1-1', subjectId:'cv10-fis', title:'Cinemática',                          description:'MU, MUV e queda livre',                                           term:1, displayOrder:1 },
  { id:'cv10fis-1-2', subjectId:'cv10-fis', title:'Dinâmica',                            description:'Forças, leis de Newton e equilíbrio',                             term:1, displayOrder:2 },
  { id:'cv10fis-2-1', subjectId:'cv10-fis', title:'Calor e Temperatura',                 description:'Escalas, dilatação e calorimetria',                               term:2, displayOrder:3 },
  { id:'cv10fis-2-2', subjectId:'cv10-fis', title:'Ondas e Acústica',                    description:'Características das ondas e fenómenos sonoros',                   term:2, displayOrder:4 },
  { id:'cv10fis-3-1', subjectId:'cv10-fis', title:'Electricidade',                       description:'Carga, campo, corrente e circuitos',                              term:3, displayOrder:5 },
  { id:'cv10fis-3-2', subjectId:'cv10-fis', title:'Energia e Sustentabilidade',          description:'Fontes renováveis — solar, eólica e do mar',                      term:3, displayOrder:6 },
];

// ============================================================
//  HELPERS — pesquisa rápida
// ============================================================

/** Retorna todos os países activos */
export const getCountries = () => COUNTRIES.filter(c => c.is_active);

/** Retorna os níveis de ensino de um país */
export const getLevelsByCountry = (countryId: string) =>
  EDUCATION_LEVELS.filter(l => l.countryId === countryId)
    .sort((a, b) => a.displayOrder - b.displayOrder);

/** Retorna as classes/anos de um nível */
export const getGradesByLevel = (levelId: string) =>
  GRADES.filter(g => g.levelId === levelId)
    .sort((a, b) => a.displayOrder - b.displayOrder);

/** Retorna as disciplinas de uma classe/ano */
export const getSubjectsByGrade = (gradeId: string) =>
  SUBJECTS.filter(s => s.gradeId === gradeId)
    .sort((a, b) => a.displayOrder - b.displayOrder);

/** Retorna os capítulos de uma disciplina, opcionalmente filtrado por trimestre */
export const getChaptersBySubject = (subjectId: string, term?: number) =>
  CHAPTERS.filter(c => c.subjectId === subjectId && (term === undefined || c.term === term))
    .sort((a, b) => a.displayOrder - b.displayOrder);

/** Retorna as disciplinas de um país + classe (via gradeId) */
export const getCurriculumTree = (countryId: string) => {
  const levels = getLevelsByCountry(countryId);
  return levels.map(level => ({
    ...level,
    grades: getGradesByLevel(level.id).map(grade => ({
      ...grade,
      subjects: getSubjectsByGrade(grade.id).map(subject => ({
        ...subject,
        chapters: getChaptersBySubject(subject.id),
      })),
    })),
  }));
};
