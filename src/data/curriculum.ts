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
  // ══ MOÇAMBIQUE — Ensino Primário (1ª a 7ª Classe — EP1 + EP2, PCEB/INDE 2003) ══
  // Disciplinas conforme o Plano de Estudos do PCEB, Tabela 4 (regime de 2 turnos,
  // programa monolingue) — a tabela que corresponde à estrutura já usada neste
  // ficheiro (EP1 = 1ª-5ª classe, EP2 = 6ª-7ª classe). Língua Moçambicana fica de
  // fora por ser disciplina facultativa e dependente da região; Educação Física
  // fica de fora por não se prestar a vídeo-aula (nenhuma classe/país no ficheiro
  // inclui Educação Física como disciplina).
  { id: 'mz1-port', gradeId: 'mz-1c', name: 'Língua Portuguesa', shortName: 'PORT', icon: 'fa-book-open',  color: '#3b82f6', description: 'Iniciação à leitura, escrita e oralidade',         displayOrder: 1 },
  { id: 'mz1-mat',  gradeId: 'mz-1c', name: 'Matemática',        shortName: 'MAT',  icon: 'fa-calculator', color: '#9333ea', description: 'Números até 100, contagem e noções espaciais',     displayOrder: 2 },
  { id: 'mz1-ev',   gradeId: 'mz-1c', name: 'Educação Visual',   shortName: 'EV',   icon: 'fa-palette',    color: '#f97316', description: 'Desenho, observação e expressão através da imagem', displayOrder: 3 },
  { id: 'mz1-em',   gradeId: 'mz-1c', name: 'Educação Musical',  shortName: 'EM',   icon: 'fa-music',      color: '#ec4899', description: 'Jogos, canções e ritmo',                          displayOrder: 4 },
  { id: 'mz1-of',   gradeId: 'mz-1c', name: 'Ofícios',           shortName: 'OF',   icon: 'fa-hammer',     color: '#78716c', description: 'Iniciação a actividades manuais e práticas',       displayOrder: 5 },

  { id: 'mz2-port', gradeId: 'mz-2c', name: 'Língua Portuguesa', shortName: 'PORT', icon: 'fa-book-open',  color: '#3b82f6', description: 'Leitura de textos curtos e primeiras produções',   displayOrder: 1 },
  { id: 'mz2-mat',  gradeId: 'mz-2c', name: 'Matemática',        shortName: 'MAT',  icon: 'fa-calculator', color: '#9333ea', description: 'Números até 1000 e introdução à multiplicação',    displayOrder: 2 },
  { id: 'mz2-ev',   gradeId: 'mz-2c', name: 'Educação Visual',   shortName: 'EV',   icon: 'fa-palette',    color: '#f97316', description: 'Desenho de formas e modelagem',                    displayOrder: 3 },
  { id: 'mz2-em',   gradeId: 'mz-2c', name: 'Educação Musical',  shortName: 'EM',   icon: 'fa-music',      color: '#ec4899', description: 'Canções tradicionais e percussão corporal',        displayOrder: 4 },
  { id: 'mz2-of',   gradeId: 'mz-2c', name: 'Ofícios',           shortName: 'OF',   icon: 'fa-hammer',     color: '#78716c', description: 'Costura simples e jardinagem',                     displayOrder: 5 },

  { id: 'mz3-port', gradeId: 'mz-3c', name: 'Língua Portuguesa', shortName: 'PORT', icon: 'fa-book-open',  color: '#3b82f6', description: 'Leitura interpretativa e produção textual',        displayOrder: 1 },
  { id: 'mz3-mat',  gradeId: 'mz-3c', name: 'Matemática',        shortName: 'MAT',  icon: 'fa-calculator', color: '#9333ea', description: 'Tabuadas, fracções iniciais e medidas',            displayOrder: 2 },
  { id: 'mz3-cn',   gradeId: 'mz-3c', name: 'Ciências Naturais', shortName: 'CN',   icon: 'fa-leaf',       color: '#22c55e', description: 'Corpo humano, seres vivos e recursos naturais',    displayOrder: 3 },
  { id: 'mz3-ev',   gradeId: 'mz-3c', name: 'Educação Visual',   shortName: 'EV',   icon: 'fa-palette',    color: '#f97316', description: 'Desenho de observação e construções geométricas', displayOrder: 4 },
  { id: 'mz3-em',   gradeId: 'mz-3c', name: 'Educação Musical',  shortName: 'EM',   icon: 'fa-music',      color: '#ec4899', description: 'Instrumentos tradicionais e ritmo',                displayOrder: 5 },
  { id: 'mz3-of',   gradeId: 'mz-3c', name: 'Ofícios',           shortName: 'OF',   icon: 'fa-hammer',     color: '#78716c', description: 'Marcenaria básica e agro-pecuária',                displayOrder: 6 },

  { id: 'mz4-port', gradeId: 'mz-4c', name: 'Língua Portuguesa', shortName: 'PORT', icon: 'fa-book-open',  color: '#3b82f6', description: 'Classes de palavras e texto narrativo/descritivo', displayOrder: 1 },
  { id: 'mz4-mat',  gradeId: 'mz-4c', name: 'Matemática',        shortName: 'MAT',  icon: 'fa-calculator', color: '#9333ea', description: 'Fracções, perímetro e literacia financeira',       displayOrder: 2 },
  { id: 'mz4-cs',   gradeId: 'mz-4c', name: 'Ciências Sociais',  shortName: 'CS',   icon: 'fa-landmark',   color: '#f59e0b', description: 'Espaço, tempo, direitos e deveres da criança',     displayOrder: 3 },
  { id: 'mz4-cn',   gradeId: 'mz-4c', name: 'Ciências Naturais', shortName: 'CN',   icon: 'fa-leaf',       color: '#22c55e', description: 'Sistemas do corpo humano e ecossistemas',          displayOrder: 4 },
  { id: 'mz4-ev',   gradeId: 'mz-4c', name: 'Educação Visual',   shortName: 'EV',   icon: 'fa-palette',    color: '#f97316', description: 'Proporção, composição e desenho técnico inicial',  displayOrder: 5 },
  { id: 'mz4-em',   gradeId: 'mz-4c', name: 'Educação Musical',  shortName: 'EM',   icon: 'fa-music',      color: '#ec4899', description: 'Música das regiões de Moçambique',                 displayOrder: 6 },
  { id: 'mz4-of',   gradeId: 'mz-4c', name: 'Ofícios',           shortName: 'OF',   icon: 'fa-hammer',     color: '#78716c', description: 'Artesanato e técnicas de cultivo',                 displayOrder: 7 },

  { id: 'mz5-port', gradeId: 'mz-5c', name: 'Língua Portuguesa', shortName: 'PORT', icon: 'fa-book-open',  color: '#3b82f6', description: 'Texto argumentativo e tempos verbais',             displayOrder: 1 },
  { id: 'mz5-mat',  gradeId: 'mz-5c', name: 'Matemática',        shortName: 'MAT',  icon: 'fa-calculator', color: '#9333ea', description: 'Decimais, área, volume e estatística inicial',     displayOrder: 2 },
  { id: 'mz5-cs',   gradeId: 'mz-5c', name: 'Ciências Sociais',  shortName: 'CS',   icon: 'fa-landmark',   color: '#f59e0b', description: 'Regiões de Moçambique e história pré-colonial',    displayOrder: 3 },
  { id: 'mz5-cn',   gradeId: 'mz-5c', name: 'Ciências Naturais', shortName: 'CN',   icon: 'fa-leaf',       color: '#22c55e', description: 'Sistemas do corpo humano e recursos naturais',     displayOrder: 4 },
  { id: 'mz5-ev',   gradeId: 'mz-5c', name: 'Educação Visual',   shortName: 'EV',   icon: 'fa-palette',    color: '#f97316', description: 'Desenho técnico e ilustração',                     displayOrder: 5 },
  { id: 'mz5-em',   gradeId: 'mz-5c', name: 'Educação Musical',  shortName: 'EM',   icon: 'fa-music',      color: '#ec4899', description: 'Timbre, altura e composição musical simples',      displayOrder: 6 },
  { id: 'mz5-of',   gradeId: 'mz-5c', name: 'Ofícios',           shortName: 'OF',   icon: 'fa-hammer',     color: '#78716c', description: 'Marcenaria, pesca e culinária tradicional',        displayOrder: 7 },

  { id: 'mz6-port', gradeId: 'mz-6c', name: 'Língua Portuguesa', shortName: 'PORT', icon: 'fa-book-open',  color: '#3b82f6', description: 'Texto argumentativo avançado e literatura moçambicana', displayOrder: 1 },
  { id: 'mz6-mat',  gradeId: 'mz-6c', name: 'Matemática',        shortName: 'MAT',  icon: 'fa-calculator', color: '#9333ea', description: 'Proporcionalidade, percentagem e estatística',      displayOrder: 2 },
  { id: 'mz6-cs',   gradeId: 'mz-6c', name: 'Ciências Sociais',  shortName: 'CS',   icon: 'fa-landmark',   color: '#f59e0b', description: 'Colonização, resistência e instituições do Estado', displayOrder: 3 },
  { id: 'mz6-cn',   gradeId: 'mz-6c', name: 'Ciências Naturais', shortName: 'CN',   icon: 'fa-leaf',       color: '#22c55e', description: 'Célula, ambiente e biodiversidade',                 displayOrder: 4 },
  { id: 'mz6-ev',   gradeId: 'mz-6c', name: 'Educação Visual',   shortName: 'EV',   icon: 'fa-palette',    color: '#f97316', description: 'Desenho técnico e projecto criativo',              displayOrder: 5 },
  { id: 'mz6-em',   gradeId: 'mz-6c', name: 'Educação Musical',  shortName: 'EM',   icon: 'fa-music',      color: '#ec4899', description: 'Escrita musical elementar e harmonia',             displayOrder: 6 },
  { id: 'mz6-of',   gradeId: 'mz-6c', name: 'Ofícios',           shortName: 'OF',   icon: 'fa-hammer',     color: '#78716c', description: 'Agro-pecuária e artesanato para o mercado local',   displayOrder: 7 },
  { id: 'mz6-ing',  gradeId: 'mz-6c', name: 'Língua Inglesa',    shortName: 'ING',  icon: 'fa-language',   color: '#7c3aed', description: 'Vocabulário básico para comunicação',               displayOrder: 8 },
  { id: 'mz6-emc',  gradeId: 'mz-6c', name: 'Ed. Moral e Cívica',shortName: 'EMC',  icon: 'fa-handshake',  color: '#64748b', description: 'Direitos, deveres e valores cívicos',               displayOrder: 9 },

  { id: 'mz7-port', gradeId: 'mz-7c', name: 'Língua Portuguesa', shortName: 'PORT', icon: 'fa-book-open',  color: '#3b82f6', description: 'Produção textual formal e literatura moçambicana', displayOrder: 1 },
  { id: 'mz7-mat',  gradeId: 'mz-7c', name: 'Matemática',        shortName: 'MAT',  icon: 'fa-calculator', color: '#9333ea', description: 'Potências, equações e geometria de sólidos',        displayOrder: 2 },
  { id: 'mz7-cs',   gradeId: 'mz-7c', name: 'Ciências Sociais',  shortName: 'CS',   icon: 'fa-landmark',   color: '#f59e0b', description: 'Independência de Moçambique e geopolítica',         displayOrder: 3 },
  { id: 'mz7-cn',   gradeId: 'mz-7c', name: 'Ciências Naturais', shortName: 'CN',   icon: 'fa-leaf',       color: '#22c55e', description: 'Genética elementar e sustentabilidade',             displayOrder: 4 },
  { id: 'mz7-ev',   gradeId: 'mz-7c', name: 'Educação Visual',   shortName: 'EV',   icon: 'fa-palette',    color: '#f97316', description: 'Desenho técnico avançado e projecto final',         displayOrder: 5 },
  { id: 'mz7-em',   gradeId: 'mz-7c', name: 'Educação Musical',  shortName: 'EM',   icon: 'fa-music',      color: '#ec4899', description: 'Leitura de partituras e música contemporânea',      displayOrder: 6 },
  { id: 'mz7-of',   gradeId: 'mz-7c', name: 'Ofícios',           shortName: 'OF',   icon: 'fa-hammer',     color: '#78716c', description: 'Empreendedorismo e técnicas avançadas de artesanato', displayOrder: 7 },
  { id: 'mz7-ing',  gradeId: 'mz-7c', name: 'Língua Inglesa',    shortName: 'ING',  icon: 'fa-language',   color: '#7c3aed', description: 'Rotinas, descrições e comunicação funcional',       displayOrder: 8 },
  { id: 'mz7-emc',  gradeId: 'mz-7c', name: 'Ed. Moral e Cívica',shortName: 'EMC',  icon: 'fa-handshake',  color: '#64748b', description: 'Democracia, direitos humanos e ética',              displayOrder: 9 },

  // ══ MOÇAMBIQUE 8ª Classe (ESG1 — 1º Ciclo) ══
  // Disciplinas do tronco comum do ESG1 + área de Actividades Práticas e
  // Tecnológicas (Educação Visual, TIC, Noções de Empreendedorismo,
  // Agro-Pecuária), conforme o currículo do ESG (INDE/MEC). Educação Física
  // fica de fora por não se prestar a vídeo-aula (padrão já usado no ficheiro).
  { id: 'mz8-mat',  gradeId: 'mz-8c', name: 'Matemática',            shortName: 'MAT', icon: 'fa-calculator',    color: '#9333ea', description: 'Conjuntos, funções e trigonometria inicial',        displayOrder: 1 },
  { id: 'mz8-port', gradeId: 'mz-8c', name: 'Português',             shortName: 'PORT',icon: 'fa-book-open',    color: '#3b82f6', description: 'Gramática, leitura e produção de texto',            displayOrder: 2 },
  { id: 'mz8-fis',  gradeId: 'mz-8c', name: 'Física',                shortName: 'FIS', icon: 'fa-atom',         color: '#10b981', description: 'Grandezas físicas e métodos de medição',            displayOrder: 3 },
  { id: 'mz8-qui',  gradeId: 'mz-8c', name: 'Química',               shortName: 'QUI', icon: 'fa-flask',        color: '#f59e0b', description: 'Introdução à matéria e às transformações químicas', displayOrder: 4 },
  { id: 'mz8-bio',  gradeId: 'mz-8c', name: 'Biologia',              shortName: 'BIO', icon: 'fa-leaf',         color: '#22c55e', description: 'Célula, tecidos e níveis de organização',           displayOrder: 5 },
  { id: 'mz8-geo',  gradeId: 'mz-8c', name: 'Geografia',             shortName: 'GEO', icon: 'fa-globe-africa', color: '#0ea5e9', description: 'Geografia física de Moçambique',                    displayOrder: 6 },
  { id: 'mz8-his',  gradeId: 'mz-8c', name: 'História',              shortName: 'HIS', icon: 'fa-landmark',     color: '#dc2626', description: 'Pré-história e primeiras civilizações',             displayOrder: 7 },
  { id: 'mz8-ing',  gradeId: 'mz-8c', name: 'Inglês',                shortName: 'ING', icon: 'fa-language',     color: '#7c3aed', description: 'Inglês básico — comunicação elementar',             displayOrder: 8 },
  { id: 'mz8-ev',   gradeId: 'mz-8c', name: 'Educação Visual',       shortName: 'EV',  icon: 'fa-palette',      color: '#f97316', description: 'Desenho, expressão e técnicas de representação',   displayOrder: 9 },
  { id: 'mz8-tic',  gradeId: 'mz-8c', name: 'TIC',                   shortName: 'TIC', icon: 'fa-laptop-code',  color: '#0891b2', description: 'Introdução às Tecnologias de Informação e Comunicação', displayOrder: 10 },
  { id: 'mz8-emp',  gradeId: 'mz-8c', name: 'Noções de Empreendedorismo', shortName: 'EMP', icon: 'fa-briefcase', color: '#16a34a', description: 'Espírito empreendedor e identificação de oportunidades', displayOrder: 11 },
  { id: 'mz8-agro', gradeId: 'mz-8c', name: 'Agro-Pecuária',         shortName: 'AGRO',icon: 'fa-tractor',      color: '#84cc16', description: 'Técnicas básicas de produção agro-pecuária',        displayOrder: 12 },

  // ══ MOÇAMBIQUE 9ª Classe (ESG1 — 1º Ciclo) ══
  { id: 'mz9-mat',  gradeId: 'mz-9c', name: 'Matemática',            shortName: 'MAT', icon: 'fa-calculator',    color: '#9333ea', description: 'Equações, funções e estatística',                   displayOrder: 1 },
  { id: 'mz9-port', gradeId: 'mz-9c', name: 'Português',             shortName: 'PORT',icon: 'fa-book-open',    color: '#3b82f6', description: 'Textos argumentativos e literatura',                displayOrder: 2 },
  { id: 'mz9-fis',  gradeId: 'mz-9c', name: 'Física',                shortName: 'FIS', icon: 'fa-atom',         color: '#10b981', description: 'Mecânica — cinemática e dinâmica',                  displayOrder: 3 },
  { id: 'mz9-qui',  gradeId: 'mz-9c', name: 'Química',               shortName: 'QUI', icon: 'fa-flask',        color: '#f59e0b', description: 'Tabela periódica e ligações químicas',              displayOrder: 4 },
  { id: 'mz9-bio',  gradeId: 'mz-9c', name: 'Biologia',              shortName: 'BIO', icon: 'fa-leaf',         color: '#22c55e', description: 'Genética básica e reprodução',                       displayOrder: 5 },
  { id: 'mz9-geo',  gradeId: 'mz-9c', name: 'Geografia',             shortName: 'GEO', icon: 'fa-globe-africa', color: '#0ea5e9', description: 'Geografia humana e económica de Moçambique',        displayOrder: 6 },
  { id: 'mz9-his',  gradeId: 'mz-9c', name: 'História',              shortName: 'HIS', icon: 'fa-landmark',     color: '#dc2626', description: 'Moçambique colonial e luta de libertação',          displayOrder: 7 },
  { id: 'mz9-ing',  gradeId: 'mz-9c', name: 'Inglês',                shortName: 'ING', icon: 'fa-language',     color: '#7c3aed', description: 'Inglês pré-intermédio',                             displayOrder: 8 },
  { id: 'mz9-ev',   gradeId: 'mz-9c', name: 'Educação Visual',       shortName: 'EV',  icon: 'fa-palette',      color: '#f97316', description: 'Desenho técnico inicial e expressão plástica',      displayOrder: 9 },
  { id: 'mz9-tic',  gradeId: 'mz-9c', name: 'TIC',                   shortName: 'TIC', icon: 'fa-laptop-code',  color: '#0891b2', description: 'Ferramentas digitais e pesquisa de informação',     displayOrder: 10 },
  { id: 'mz9-emp',  gradeId: 'mz-9c', name: 'Noções de Empreendedorismo', shortName: 'EMP', icon: 'fa-briefcase', color: '#16a34a', description: 'Gestão de pequenas iniciativas e ideias de negócio', displayOrder: 11 },
  { id: 'mz9-agro', gradeId: 'mz-9c', name: 'Agro-Pecuária',         shortName: 'AGRO',icon: 'fa-tractor',      color: '#84cc16', description: 'Produção e conservação de produtos agro-pecuários', displayOrder: 12 },

  // ══ MOÇAMBIQUE 10ª Classe (ESG1 — 1º Ciclo) ══
  { id: 'mz10-mat',  gradeId: 'mz-10c', name: 'Matemática',        shortName: 'MAT', icon: 'fa-calculator', color: '#9333ea', description: 'Álgebra, Geometria Analítica e Trigonometria',     displayOrder: 1 },
  { id: 'mz10-port', gradeId: 'mz-10c', name: 'Português',         shortName: 'PORT',icon: 'fa-book-open',  color: '#3b82f6', description: 'Gramática, Literatura e Produção de Texto',        displayOrder: 2 },
  { id: 'mz10-fis',  gradeId: 'mz-10c', name: 'Física',            shortName: 'FIS', icon: 'fa-atom',       color: '#10b981', description: 'Mecânica, Termodinâmica e Electricidade',           displayOrder: 3 },
  { id: 'mz10-qui',  gradeId: 'mz-10c', name: 'Química',           shortName: 'QUI', icon: 'fa-flask',      color: '#f59e0b', description: 'Química Geral, Inorgânica e Orgânica',              displayOrder: 4 },
  { id: 'mz10-bio',  gradeId: 'mz-10c', name: 'Biologia',          shortName: 'BIO', icon: 'fa-leaf',       color: '#22c55e', description: 'Citologia, Genética e Ecologia',                   displayOrder: 5 },
  { id: 'mz10-geo',  gradeId: 'mz-10c', name: 'Geografia',         shortName: 'GEO', icon: 'fa-globe-africa',color:'#0ea5e9', description: 'Geografia Física e Humana de Moçambique e Mundo',  displayOrder: 6 },
  { id: 'mz10-his',  gradeId: 'mz-10c', name: 'História',          shortName: 'HIS', icon: 'fa-landmark',   color: '#dc2626', description: 'História de Moçambique e Universal',               displayOrder: 7 },
  { id: 'mz10-ing',  gradeId: 'mz-10c', name: 'Inglês',            shortName: 'ING', icon: 'fa-language',   color: '#7c3aed', description: 'Língua Inglesa — Comunicação e Gramática',         displayOrder: 8 },
  { id: 'mz10-edm',  gradeId: 'mz-10c', name: 'Ed. Moral e Cívica',shortName: 'EMC', icon: 'fa-handshake',  color: '#64748b', description: 'Valores cívicos e cidadania',                       displayOrder: 9 },
  { id: 'mz10-ev',   gradeId: 'mz-10c', name: 'Educação Visual',   shortName: 'EV',  icon: 'fa-palette',    color: '#f97316', description: 'Desenho, projecção e técnicas de expressão plástica', displayOrder: 10 },
  { id: 'mz10-tic',  gradeId: 'mz-10c', name: 'TIC',               shortName: 'TIC', icon: 'fa-laptop-code',color: '#0891b2', description: 'Sistematização e tratamento de informação digital', displayOrder: 11 },
  { id: 'mz10-emp',  gradeId: 'mz-10c', name: 'Noções de Empreendedorismo', shortName: 'EMP', icon: 'fa-briefcase', color: '#16a34a', description: 'Identificação e gestão de oportunidades de negócio', displayOrder: 12 },
  { id: 'mz10-agro', gradeId: 'mz-10c', name: 'Agro-Pecuária',     shortName: 'AGRO',icon: 'fa-tractor',    color: '#84cc16', description: 'Técnicas de produção e conservação agro-pecuária',  displayOrder: 13 },

  // ══ MOÇAMBIQUE 11ª Classe (ESG2 — 2º Ciclo, Tronco Comum + Opções) ══
  // Tronco comum + disciplina profissionalizante (o aluno escolhe uma) +
  // disciplinas das três opções de especialização (Comunicação e Ciências
  // Sociais / Matemática e Ciências Naturais / Artes Visuais e Cénicas).
  { id: 'mz11-mat',  gradeId: 'mz-11c', name: 'Matemática',        shortName: 'MAT', icon: 'fa-calculator', color: '#9333ea', description: 'Cálculo diferencial, Integrais e Álgebra',         displayOrder: 1 },
  { id: 'mz11-port', gradeId: 'mz-11c', name: 'Português',         shortName: 'PORT',icon: 'fa-book-open',  color: '#3b82f6', description: 'Literatura Moçambicana e Portuguesa',              displayOrder: 2 },
  { id: 'mz11-fis',  gradeId: 'mz-11c', name: 'Física',            shortName: 'FIS', icon: 'fa-atom',       color: '#10b981', description: 'Óptica, Electromagnetismo e Física Moderna',        displayOrder: 3 },
  { id: 'mz11-qui',  gradeId: 'mz-11c', name: 'Química',           shortName: 'QUI', icon: 'fa-flask',      color: '#f59e0b', description: 'Electroquímica e Química Orgânica Avançada',       displayOrder: 4 },
  { id: 'mz11-bio',  gradeId: 'mz-11c', name: 'Biologia',          shortName: 'BIO', icon: 'fa-leaf',       color: '#22c55e', description: 'Anatomia, Fisiologia e Biotecnologia',              displayOrder: 5 },
  { id: 'mz11-geo',  gradeId: 'mz-11c', name: 'Geografia',         shortName: 'GEO', icon: 'fa-globe-africa',color:'#0ea5e9', description: 'Geopolítica, Recursos Naturais e Desenvolvimento', displayOrder: 6 },
  { id: 'mz11-his',  gradeId: 'mz-11c', name: 'História',          shortName: 'HIS', icon: 'fa-landmark',   color: '#dc2626', description: 'História Contemporânea e Relações Internacionais',  displayOrder: 7 },
  { id: 'mz11-ing',  gradeId: 'mz-11c', name: 'Inglês',            shortName: 'ING', icon: 'fa-language',   color: '#7c3aed', description: 'Inglês Intermediário-Avançado',                    displayOrder: 8 },
  { id: 'mz11-fil',  gradeId: 'mz-11c', name: 'Introdução à Filosofia', shortName: 'FIL', icon: 'fa-brain',  color: '#64748b', description: 'Reflexão crítica sobre a realidade e o conhecimento', displayOrder: 9 },
  { id: 'mz11-tic',  gradeId: 'mz-11c', name: 'TIC',               shortName: 'TIC', icon: 'fa-laptop-code',color: '#0891b2', description: 'Tecnologia aplicada à área de especialidade',       displayOrder: 10 },
  { id: 'mz11-emp',  gradeId: 'mz-11c', name: 'Noções de Empreendedorismo', shortName: 'EMP', icon: 'fa-briefcase', color: '#16a34a', description: 'Nível II — gestão da produção, qualidade e finanças', displayOrder: 11 },
  { id: 'mz11-psi',  gradeId: 'mz-11c', name: 'Introdução à Psicologia e Pedagogia', shortName: 'PSI', icon: 'fa-user-graduate', color: '#ec4899', description: 'Noções básicas de psicologia e didáctica geral',   displayOrder: 12 },
  { id: 'mz11-lm',   gradeId: 'mz-11c', name: 'Línguas Moçambicanas', shortName: 'LM', icon: 'fa-comments',  color: '#14b8a6', description: 'Aprofundamento linguístico de uma língua moçambicana', displayOrder: 13 },
  { id: 'mz11-fr',   gradeId: 'mz-11c', name: 'Francês',           shortName: 'FR',  icon: 'fa-language',   color: '#6366f1', description: 'Língua Francesa — compreensão e expressão básica', displayOrder: 14 },
  { id: 'mz11-dgd',  gradeId: 'mz-11c', name: 'Desenho e Geometria Descritiva', shortName: 'DGD', icon: 'fa-drafting-compass', color: '#a855f7', description: 'Projecções e métodos de representação gráfica',   displayOrder: 15 },
  { id: 'mz11-ev',   gradeId: 'mz-11c', name: 'Educação Visual',   shortName: 'EV',  icon: 'fa-palette',    color: '#f97316', description: 'Expressão plástica e produção artística',          displayOrder: 16 },
  { id: 'mz11-ac',   gradeId: 'mz-11c', name: 'Artes Cénicas',     shortName: 'AC',  icon: 'fa-masks-theater', color: '#f43f5e', description: 'Teatro, música e dança',                          displayOrder: 17 },

  // ══ MOÇAMBIQUE 12ª Classe (ESG2 — 2º Ciclo, Tronco Comum + Opções) ══
  { id: 'mz12-mat',  gradeId: 'mz-12c', name: 'Matemática',        shortName: 'MAT', icon: 'fa-calculator', color: '#9333ea', description: 'Cálculo Integral, Probabilidades e Estatística',  displayOrder: 1 },
  { id: 'mz12-port', gradeId: 'mz-12c', name: 'Português',         shortName: 'PORT',icon: 'fa-book-open',  color: '#3b82f6', description: 'Produção Textual, Análise Literária',              displayOrder: 2 },
  { id: 'mz12-fis',  gradeId: 'mz-12c', name: 'Física',            shortName: 'FIS', icon: 'fa-atom',       color: '#10b981', description: 'Física Atómica e Nuclear',                         displayOrder: 3 },
  { id: 'mz12-qui',  gradeId: 'mz-12c', name: 'Química',           shortName: 'QUI', icon: 'fa-flask',      color: '#f59e0b', description: 'Química Industrial e Ambiental',                   displayOrder: 4 },
  { id: 'mz12-bio',  gradeId: 'mz-12c', name: 'Biologia',          shortName: 'BIO', icon: 'fa-leaf',       color: '#22c55e', description: 'Microbiologia, Imunologia e Saúde',                displayOrder: 5 },
  { id: 'mz12-geo',  gradeId: 'mz-12c', name: 'Geografia',         shortName: 'GEO', icon: 'fa-globe-africa',color:'#0ea5e9', description: 'Geografia Física e Económica — Aprofundamento',    displayOrder: 6 },
  { id: 'mz12-his',  gradeId: 'mz-12c', name: 'História',          shortName: 'HIS', icon: 'fa-landmark',   color: '#dc2626', description: 'História Contemporânea e Cidadania',               displayOrder: 7 },
  { id: 'mz12-ing',  gradeId: 'mz-12c', name: 'Inglês',            shortName: 'ING', icon: 'fa-language',   color: '#7c3aed', description: 'Inglês avançado para fins académicos e profissionais', displayOrder: 8 },
  { id: 'mz12-fil',  gradeId: 'mz-12c', name: 'Introdução à Filosofia', shortName: 'FIL', icon: 'fa-brain',  color: '#64748b', description: 'Reflexão crítica sobre a realidade e o conhecimento', displayOrder: 9 },
  { id: 'mz12-tic',  gradeId: 'mz-12c', name: 'TIC',               shortName: 'TIC', icon: 'fa-laptop-code',color: '#0891b2', description: 'Tecnologia aplicada à área de especialidade',       displayOrder: 10 },
  { id: 'mz12-emp',  gradeId: 'mz-12c', name: 'Noções de Empreendedorismo', shortName: 'EMP', icon: 'fa-briefcase', color: '#16a34a', description: 'Nível II — gestão da produção, qualidade e finanças', displayOrder: 11 },
  { id: 'mz12-psi',  gradeId: 'mz-12c', name: 'Introdução à Psicologia e Pedagogia', shortName: 'PSI', icon: 'fa-user-graduate', color: '#ec4899', description: 'Noções básicas de psicologia e didáctica geral',   displayOrder: 12 },
  { id: 'mz12-lm',   gradeId: 'mz-12c', name: 'Línguas Moçambicanas', shortName: 'LM', icon: 'fa-comments',  color: '#14b8a6', description: 'Aprofundamento linguístico de uma língua moçambicana', displayOrder: 13 },
  { id: 'mz12-fr',   gradeId: 'mz-12c', name: 'Francês',           shortName: 'FR',  icon: 'fa-language',   color: '#6366f1', description: 'Língua Francesa — compreensão e expressão básica', displayOrder: 14 },
  { id: 'mz12-dgd',  gradeId: 'mz-12c', name: 'Desenho e Geometria Descritiva', shortName: 'DGD', icon: 'fa-drafting-compass', color: '#a855f7', description: 'Projecções e métodos de representação gráfica',   displayOrder: 15 },
  { id: 'mz12-ev',   gradeId: 'mz-12c', name: 'Educação Visual',   shortName: 'EV',  icon: 'fa-palette',    color: '#f97316', description: 'Expressão plástica e produção artística',          displayOrder: 16 },
  { id: 'mz12-ac',   gradeId: 'mz-12c', name: 'Artes Cénicas',     shortName: 'AC',  icon: 'fa-masks-theater', color: '#f43f5e', description: 'Teatro, música e dança',                          displayOrder: 17 },

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
  //  MOÇAMBIQUE — Ensino Primário (1ª a 6ª Classe)
  //  Capítulos derivados das áreas de estudo e competências descritas no
  //  PCEP (secções 9.1, 10.1-10.3) — o documento não traz um programa
  //  disciplina-a-disciplina por classe, apenas o enquadramento por área.
  // ══════════════════════════════════════════════════════════

  // ─── 1ª Classe — Língua Portuguesa ────────────────────────
  { id:'mz1port-1', subjectId:'mz1-port', title:'Vogais e Consoantes',            description:'Reconhecimento oral e escrito das letras',                term:1, displayOrder:1 },
  { id:'mz1port-2', subjectId:'mz1-port', title:'Sílabas Simples',                description:'Formação de sílabas e primeiras palavras',                 term:1, displayOrder:2 },
  { id:'mz1port-3', subjectId:'mz1-port', title:'O Meu Nome e a Minha Família',   description:'Vocabulário do quotidiano e oralidade',                    term:1, displayOrder:3 },
  { id:'mz1port-4', subjectId:'mz1-port', title:'Leitura de Palavras Simples',    description:'Consciência fonológica e decodificação',                   term:2, displayOrder:4 },
  { id:'mz1port-5', subjectId:'mz1-port', title:'Escrita de Palavras',            description:'Cópia e ditado de palavras curtas',                        term:2, displayOrder:5 },
  { id:'mz1port-6', subjectId:'mz1-port', title:'Higiene e Saúde',                description:'Vocabulário sobre cuidados com o corpo',                   term:2, displayOrder:6 },
  { id:'mz1port-7', subjectId:'mz1-port', title:'Frases Simples',                 description:'Construção e leitura de frases curtas',                    term:3, displayOrder:7 },
  { id:'mz1port-8', subjectId:'mz1-port', title:'Histórias Curtas',               description:'Compreensão oral de pequenas histórias',                   term:3, displayOrder:8 },
  { id:'mz1port-9', subjectId:'mz1-port', title:'Revisão e Consolidação',         description:'Leitura e escrita do que foi aprendido no ano',            term:3, displayOrder:9 },

  // ─── 1ª Classe — Matemática ───────────────────────────────
  { id:'mz1mat-1', subjectId:'mz1-mat', title:'Números até 10',                  description:'Contagem, leitura e escrita',                              term:1, displayOrder:1 },
  { id:'mz1mat-2', subjectId:'mz1-mat', title:'Noções Espaciais',                description:'Dentro/fora, perto/longe, em cima/em baixo',               term:1, displayOrder:2 },
  { id:'mz1mat-3', subjectId:'mz1-mat', title:'Formas Geométricas Simples',      description:'Círculo, quadrado, triângulo e rectângulo',                term:1, displayOrder:3 },
  { id:'mz1mat-4', subjectId:'mz1-mat', title:'Números até 20',                  description:'Contagem e sequência numérica',                            term:2, displayOrder:4 },
  { id:'mz1mat-5', subjectId:'mz1-mat', title:'Adição Simples',                  description:'Juntar quantidades até 20',                                term:2, displayOrder:5 },
  { id:'mz1mat-6', subjectId:'mz1-mat', title:'Subtracção Simples',              description:'Tirar quantidades até 20',                                 term:2, displayOrder:6 },
  { id:'mz1mat-7', subjectId:'mz1-mat', title:'Números até 100',                 description:'Contagem por dezenas',                                     term:3, displayOrder:7 },
  { id:'mz1mat-8', subjectId:'mz1-mat', title:'Comparação de Quantidades',       description:'Maior, menor e igual',                                     term:3, displayOrder:8 },
  { id:'mz1mat-9', subjectId:'mz1-mat', title:'Resolução de Problemas do Quotidiano', description:'Situações simples de contar e calcular',             term:3, displayOrder:9 },

  // ─── 2ª Classe — Língua Portuguesa ────────────────────────
  { id:'mz2port-1', subjectId:'mz2-port', title:'Alfabeto e Ordem Alfabética',    description:'Reconhecimento e sequência das letras',                    term:1, displayOrder:1 },
  { id:'mz2port-2', subjectId:'mz2-port', title:'Sílabas Complexas',             description:'Encontros consonantais e vocálicos',                       term:1, displayOrder:2 },
  { id:'mz2port-3', subjectId:'mz2-port', title:'Leitura de Textos Curtos',      description:'Compreensão de pequenos textos ilustrados',                term:1, displayOrder:3 },
  { id:'mz2port-4', subjectId:'mz2-port', title:'Produção de Frases e Pequenos Textos', description:'Escrita orientada de frases simples',                term:2, displayOrder:4 },
  { id:'mz2port-5', subjectId:'mz2-port', title:'Substantivos e Adjectivos',     description:'Noções iniciais de classes de palavras',                   term:2, displayOrder:5 },
  { id:'mz2port-6', subjectId:'mz2-port', title:'Relação com os Outros',         description:'Vocabulário de convivência e respeito',                    term:2, displayOrder:6 },
  { id:'mz2port-7', subjectId:'mz2-port', title:'Pontuação Básica',              description:'Ponto final e ponto de interrogação',                      term:3, displayOrder:7 },
  { id:'mz2port-8', subjectId:'mz2-port', title:'Leitura Expressiva de Histórias', description:'Entoação e compreensão de pequenas narrativas',          term:3, displayOrder:8 },
  { id:'mz2port-9', subjectId:'mz2-port', title:'Revisão e Consolidação',        description:'Leitura e escrita do que foi aprendido no ano',             term:3, displayOrder:9 },

  // ─── 2ª Classe — Matemática ───────────────────────────────
  { id:'mz2mat-1', subjectId:'mz2-mat', title:'Números até 100',                 description:'Leitura, escrita e ordenação',                             term:1, displayOrder:1 },
  { id:'mz2mat-2', subjectId:'mz2-mat', title:'Adição com Transporte',           description:'Somar números com reagrupamento',                          term:1, displayOrder:2 },
  { id:'mz2mat-3', subjectId:'mz2-mat', title:'Subtracção com Empréstimo',       description:'Subtrair números com reagrupamento',                       term:1, displayOrder:3 },
  { id:'mz2mat-4', subjectId:'mz2-mat', title:'Dúzia e Dezena',                  description:'Agrupamentos de quantidades',                              term:2, displayOrder:4 },
  { id:'mz2mat-5', subjectId:'mz2-mat', title:'Introdução à Multiplicação',      description:'Soma de parcelas iguais',                                  term:2, displayOrder:5 },
  { id:'mz2mat-6', subjectId:'mz2-mat', title:'Medidas de Tempo',                description:'Dias, semanas e meses',                                    term:2, displayOrder:6 },
  { id:'mz2mat-7', subjectId:'mz2-mat', title:'Números até 1000',                description:'Leitura, escrita e valor posicional',                      term:3, displayOrder:7 },
  { id:'mz2mat-8', subjectId:'mz2-mat', title:'Moeda Moçambicana',               description:'Reconhecimento e uso simples do metical',                  term:3, displayOrder:8 },
  { id:'mz2mat-9', subjectId:'mz2-mat', title:'Resolução de Problemas',          description:'Problemas do quotidiano com as operações aprendidas',      term:3, displayOrder:9 },

  // ─── 3ª Classe — Língua Portuguesa ────────────────────────
  { id:'mz3port-1', subjectId:'mz3-port', title:'Tipos de Frase',                description:'Afirmativa, negativa, interrogativa e exclamativa',        term:1, displayOrder:1 },
  { id:'mz3port-2', subjectId:'mz3-port', title:'Sinónimos e Antónimos',         description:'Ampliação de vocabulário',                                 term:1, displayOrder:2 },
  { id:'mz3port-3', subjectId:'mz3-port', title:'Leitura Interpretativa de Textos', description:'Compreensão global e específica de textos',             term:1, displayOrder:3 },
  { id:'mz3port-4', subjectId:'mz3-port', title:'Produção Textual',              description:'Pequenas redacções e recados',                             term:2, displayOrder:4 },
  { id:'mz3port-5', subjectId:'mz3-port', title:'Verbos',                        description:'Noção de acção e tempo verbal',                            term:2, displayOrder:5 },
  { id:'mz3port-6', subjectId:'mz3-port', title:'Ordem Alfabética e Uso do Dicionário', description:'Pesquisa e organização de palavras',                 term:2, displayOrder:6 },
  { id:'mz3port-7', subjectId:'mz3-port', title:'Texto Narrativo Simples',       description:'Início, meio e fim de uma história',                       term:3, displayOrder:7 },
  { id:'mz3port-8', subjectId:'mz3-port', title:'Concordância entre Género e Número', description:'Concordância nominal básica',                          term:3, displayOrder:8 },
  { id:'mz3port-9', subjectId:'mz3-port', title:'Revisão para a Avaliação Final do Ciclo', description:'Consolidação de leitura e escrita do 1º ciclo',    term:3, displayOrder:9 },

  // ─── 3ª Classe — Matemática ───────────────────────────────
  { id:'mz3mat-1', subjectId:'mz3-mat', title:'Números até 1000',                description:'Valor posicional — unidades, dezenas e centenas',         term:1, displayOrder:1 },
  { id:'mz3mat-2', subjectId:'mz3-mat', title:'Multiplicação — Tabuadas do 2 ao 5', description:'Memorização e aplicação das tabuadas',                  term:1, displayOrder:2 },
  { id:'mz3mat-3', subjectId:'mz3-mat', title:'Divisão — Repartir em Partes Iguais', description:'Noção inicial de divisão',                              term:1, displayOrder:3 },
  { id:'mz3mat-4', subjectId:'mz3-mat', title:'Tabuadas do 6 ao 10',             description:'Memorização e aplicação das tabuadas',                     term:2, displayOrder:4 },
  { id:'mz3mat-5', subjectId:'mz3-mat', title:'Metade, Terça e Quarta Parte',    description:'Noções iniciais de fracção',                               term:2, displayOrder:5 },
  { id:'mz3mat-6', subjectId:'mz3-mat', title:'Medidas de Comprimento',          description:'Metro e centímetro',                                       term:2, displayOrder:6 },
  { id:'mz3mat-7', subjectId:'mz3-mat', title:'Medidas de Massa e Capacidade',   description:'Quilograma e litro',                                       term:3, displayOrder:7 },
  { id:'mz3mat-8', subjectId:'mz3-mat', title:'Leitura de Tabelas e Gráficos Simples', description:'Organização e interpretação de dados',                term:3, displayOrder:8 },
  { id:'mz3mat-9', subjectId:'mz3-mat', title:'Revisão para a Avaliação Final do Ciclo', description:'Consolidação das quatro operações e medidas',       term:3, displayOrder:9 },

  // ─── 4ª Classe — Língua Portuguesa ────────────────────────
  { id:'mz4port-1', subjectId:'mz4-port', title:'Classes de Palavras',           description:'Substantivo, adjectivo e verbo',                           term:1, displayOrder:1 },
  { id:'mz4port-2', subjectId:'mz4-port', title:'Texto Narrativo',               description:'Estrutura — início, meio e fim',                           term:1, displayOrder:2 },
  { id:'mz4port-3', subjectId:'mz4-port', title:'Leitura e Interpretação de Textos Informativos', description:'Compreensão de textos não literários',    term:1, displayOrder:3 },
  { id:'mz4port-4', subjectId:'mz4-port', title:'Frase Simples e Frase Complexa', description:'Distinção e construção de frases',                        term:2, displayOrder:4 },
  { id:'mz4port-5', subjectId:'mz4-port', title:'Texto Descritivo',              description:'Descrição de pessoas, lugares e objectos',                 term:2, displayOrder:5 },
  { id:'mz4port-6', subjectId:'mz4-port', title:'Uso da Vírgula e Outros Sinais de Pontuação', description:'Pontuação em textos curtos',                  term:2, displayOrder:6 },
  { id:'mz4port-7', subjectId:'mz4-port', title:'Carta e Convite',               description:'Textos funcionais do quotidiano',                          term:3, displayOrder:7 },
  { id:'mz4port-8', subjectId:'mz4-port', title:'Discurso Directo e Indirecto',  description:'Noções iniciais de citação da fala',                       term:3, displayOrder:8 },
  { id:'mz4port-9', subjectId:'mz4-port', title:'Revisão e Consolidação Anual',  description:'Consolidação da leitura e escrita da 4ª classe',           term:3, displayOrder:9 },

  // ─── 4ª Classe — Matemática ───────────────────────────────
  { id:'mz4mat-1', subjectId:'mz4-mat', title:'Números até 10 000',              description:'Leitura, escrita e valor posicional',                     term:1, displayOrder:1 },
  { id:'mz4mat-2', subjectId:'mz4-mat', title:'Multiplicação por Dois Algarismos', description:'Algoritmo da multiplicação',                             term:1, displayOrder:2 },
  { id:'mz4mat-3', subjectId:'mz4-mat', title:'Divisão com Resto',               description:'Algoritmo da divisão inteira',                             term:1, displayOrder:3 },
  { id:'mz4mat-4', subjectId:'mz4-mat', title:'Fracções',                       description:'Noção, leitura e representação de fracções',               term:2, displayOrder:4 },
  { id:'mz4mat-5', subjectId:'mz4-mat', title:'Perímetro de Figuras Planas',     description:'Cálculo do perímetro de polígonos simples',                term:2, displayOrder:5 },
  { id:'mz4mat-6', subjectId:'mz4-mat', title:'Situar e Orientar',               description:'Noções de localização e trajectos',                        term:2, displayOrder:6 },
  { id:'mz4mat-7', subjectId:'mz4-mat', title:'Ângulos e Rectas',                description:'Noções básicas de ângulo e rectas',                        term:3, displayOrder:7 },
  { id:'mz4mat-8', subjectId:'mz4-mat', title:'Interpretação de Gráficos e Tabelas', description:'Leitura e organização de dados simples',                term:3, displayOrder:8 },
  { id:'mz4mat-9', subjectId:'mz4-mat', title:'Literacia Financeira',           description:'Noções de compra, venda e troco',                          term:3, displayOrder:9 },

  // ─── 4ª Classe — Ciências Sociais ─────────────────────────
  { id:'mz4cs-1', subjectId:'mz4-cs', title:'A Minha Localidade',                description:'Espaço, tempo e comunidade',                               term:1, displayOrder:1 },
  { id:'mz4cs-2', subjectId:'mz4-cs', title:'Moçambique no Mapa',                description:'Pontos cardeais e localização',                            term:1, displayOrder:2 },
  { id:'mz4cs-3', subjectId:'mz4-cs', title:'Os Meus Direitos e Deveres',        description:'Direitos e deveres da criança',                            term:2, displayOrder:3 },
  { id:'mz4cs-4', subjectId:'mz4-cs', title:'Convivência e Respeito pela Diversidade', description:'Relação com os outros e diferenças',                 term:2, displayOrder:4 },
  { id:'mz4cs-5', subjectId:'mz4-cs', title:'Factos Históricos da Minha Comunidade', description:'Situar acontecimentos no espaço e no tempo',           term:3, displayOrder:5 },
  { id:'mz4cs-6', subjectId:'mz4-cs', title:'Cidadania e Cultura de Paz',        description:'Solidariedade e tolerância',                               term:3, displayOrder:6 },

  // ─── 4ª Classe — Ciências Naturais ────────────────────────
  { id:'mz4cn-1', subjectId:'mz4-cn', title:'O Corpo Humano',                    description:'Órgãos dos sentidos',                                      term:1, displayOrder:1 },
  { id:'mz4cn-2', subjectId:'mz4-cn', title:'Seres Vivos e Não Vivos',           description:'Características e diferenças',                             term:1, displayOrder:2 },
  { id:'mz4cn-3', subjectId:'mz4-cn', title:'Plantas',                          description:'Partes e funções das plantas',                             term:2, displayOrder:3 },
  { id:'mz4cn-4', subjectId:'mz4-cn', title:'Animais',                          description:'Características e habitats',                              term:2, displayOrder:4 },
  { id:'mz4cn-5', subjectId:'mz4-cn', title:'Água, Ar e Solo',                   description:'Recursos naturais e sua importância',                      term:3, displayOrder:5 },
  { id:'mz4cn-6', subjectId:'mz4-cn', title:'Higiene, Saúde e Bem-Estar',        description:'Práticas de vida saudável',                                term:3, displayOrder:6 },

  // ─── 5ª Classe — Língua Portuguesa ────────────────────────
  { id:'mz5port-1', subjectId:'mz5-port', title:'Texto Narrativo — Narrador e Personagens', description:'Elementos da narrativa',                        term:1, displayOrder:1 },
  { id:'mz5port-2', subjectId:'mz5-port', title:'Sinónimos, Antónimos e Homónimos', description:'Relações de sentido entre palavras',                    term:1, displayOrder:2 },
  { id:'mz5port-3', subjectId:'mz5-port', title:'Leitura Crítica de Textos',      description:'Interpretação e opinião sobre o texto',                    term:1, displayOrder:3 },
  { id:'mz5port-4', subjectId:'mz5-port', title:'Texto Argumentativo',            description:'Noções iniciais de opinião e argumento',                   term:2, displayOrder:4 },
  { id:'mz5port-5', subjectId:'mz5-port', title:'Tempos Verbais',                 description:'Presente, passado e futuro',                               term:2, displayOrder:5 },
  { id:'mz5port-6', subjectId:'mz5-port', title:'Discurso Directo e Indirecto',   description:'Transformação e uso em textos',                           term:2, displayOrder:6 },
  { id:'mz5port-7', subjectId:'mz5-port', title:'Texto Poético',                  description:'Rima, estrofe e verso',                                    term:3, displayOrder:7 },
  { id:'mz5port-8', subjectId:'mz5-port', title:'Concordância Verbal e Nominal',  description:'Regras de concordância em frases',                        term:3, displayOrder:8 },
  { id:'mz5port-9', subjectId:'mz5-port', title:'Produção de Relatórios Simples', description:'Estrutura de um relatório curto',                         term:3, displayOrder:9 },

  // ─── 5ª Classe — Matemática ───────────────────────────────
  { id:'mz5mat-1', subjectId:'mz5-mat', title:'Números Decimais',                description:'Leitura e escrita de decimais',                            term:1, displayOrder:1 },
  { id:'mz5mat-2', subjectId:'mz5-mat', title:'Operações com Fracções',          description:'Adição e subtracção de fracções',                          term:1, displayOrder:2 },
  { id:'mz5mat-3', subjectId:'mz5-mat', title:'Área de Figuras Planas',          description:'Cálculo da área de quadrados, rectângulos e triângulos',    term:1, displayOrder:3 },
  { id:'mz5mat-4', subjectId:'mz5-mat', title:'Volume — Noção Inicial',          description:'Volume de sólidos simples',                                term:2, displayOrder:4 },
  { id:'mz5mat-5', subjectId:'mz5-mat', title:'Proporcionalidade',               description:'Noções de razão',                                          term:2, displayOrder:5 },
  { id:'mz5mat-6', subjectId:'mz5-mat', title:'Estatística',                     description:'Recolha e organização de dados',                           term:2, displayOrder:6 },
  { id:'mz5mat-7', subjectId:'mz5-mat', title:'Percentagem — Noções Iniciais',   description:'Leitura e cálculo simples de percentagens',                term:3, displayOrder:7 },
  { id:'mz5mat-8', subjectId:'mz5-mat', title:'Construções Geométricas',         description:'Uso de régua e esquadro',                                  term:3, displayOrder:8 },
  { id:'mz5mat-9', subjectId:'mz5-mat', title:'Literacia Financeira',            description:'Resolução de problemas de compra, venda e poupança',       term:3, displayOrder:9 },

  // ─── 5ª Classe — Ciências Sociais ─────────────────────────
  { id:'mz5cs-1', subjectId:'mz5-cs', title:'Moçambique — Regiões e Províncias', description:'Divisão administrativa do país',                          term:1, displayOrder:1 },
  { id:'mz5cs-2', subjectId:'mz5-cs', title:'A Crosta Terrestre',                description:'Noções elementares de geologia',                           term:1, displayOrder:2 },
  { id:'mz5cs-3', subjectId:'mz5-cs', title:'Sociedades Pré-Coloniais',          description:'Reinos do Monomotapa, Maravi e Rozwi',                      term:2, displayOrder:3 },
  { id:'mz5cs-4', subjectId:'mz5-cs', title:'Recursos Económicos do País',       description:'Agricultura, pesca e recursos minerais',                    term:2, displayOrder:4 },
  { id:'mz5cs-5', subjectId:'mz5-cs', title:'Direitos Humanos e Cidadania Responsável', description:'Direitos, deveres e participação cívica',            term:3, displayOrder:5 },
  { id:'mz5cs-6', subjectId:'mz5-cs', title:'Solidariedade e Tolerância entre Povos', description:'Diversidade cultural e cultura de paz',                term:3, displayOrder:6 },

  // ─── 5ª Classe — Ciências Naturais ────────────────────────
  { id:'mz5cn-1', subjectId:'mz5-cn', title:'Sistemas do Corpo Humano',          description:'Sistema digestivo e respiratório',                        term:1, displayOrder:1 },
  { id:'mz5cn-2', subjectId:'mz5-cn', title:'Reprodução nos Seres Vivos',        description:'Noções iniciais adequadas à idade',                        term:1, displayOrder:2 },
  { id:'mz5cn-3', subjectId:'mz5-cn', title:'Ecossistemas de Moçambique',        description:'Savana, floresta e zonas costeiras',                       term:2, displayOrder:3 },
  { id:'mz5cn-4', subjectId:'mz5-cn', title:'Fenómenos Naturais',                description:'Chuva, vento e ciclones',                                  term:2, displayOrder:4 },
  { id:'mz5cn-5', subjectId:'mz5-cn', title:'Preservação do Ambiente',           description:'Uso racional dos recursos naturais',                       term:3, displayOrder:5 },
  { id:'mz5cn-6', subjectId:'mz5-cn', title:'Ciência e Tecnologia no Dia-a-Dia', description:'Aplicações simples da ciência no quotidiano',              term:3, displayOrder:6 },

  // ─── 5ª Classe — Educação Visual e Ofícios ────────────────
  { id:'mz5evo-1', subjectId:'mz5-evo', title:'Desenho e Observação',            description:'Formas, proporções e observação do real',                  term:1, displayOrder:1 },
  { id:'mz5evo-2', subjectId:'mz5-evo', title:'Recorte, Colagem e Picotagem',    description:'Técnicas de expressão através da imagem',                  term:1, displayOrder:2 },
  { id:'mz5evo-3', subjectId:'mz5-evo', title:'Culinária e Artesanato Local',    description:'Práticas ligadas às actividades da comunidade',            term:2, displayOrder:3 },
  { id:'mz5evo-4', subjectId:'mz5-evo', title:'Costura e Jardinagem',           description:'Noções básicas de costura e cultivo',                       term:2, displayOrder:4 },
  { id:'mz5evo-5', subjectId:'mz5-evo', title:'Modelagem e Construções Geométricas', description:'Trabalhos em barro e formas geométricas simples',      term:3, displayOrder:5 },
  { id:'mz5evo-6', subjectId:'mz5-evo', title:'Expressão Criativa',              description:'Pintura e materiais locais',                               term:3, displayOrder:6 },

  // ─── 6ª Classe — Língua Portuguesa ────────────────────────
  { id:'mz6port-1', subjectId:'mz6-port', title:'Texto Narrativo Complexo',       description:'Enredo, clímax e desfecho',                               term:1, displayOrder:1 },
  { id:'mz6port-2', subjectId:'mz6-port', title:'Classes de Palavras — Revisão Aprofundada', description:'Consolidação das classes gramaticais',         term:1, displayOrder:2 },
  { id:'mz6port-3', subjectId:'mz6-port', title:'Literatura Moçambicana para Crianças', description:'Contos e poemas de autores moçambicanos',            term:1, displayOrder:3 },
  { id:'mz6port-4', subjectId:'mz6-port', title:'Texto Argumentativo',           description:'Estrutura de argumentos e contra-argumentos',              term:2, displayOrder:4 },
  { id:'mz6port-5', subjectId:'mz6-port', title:'Regras de Concordância e Regência', description:'Concordância e regência verbal e nominal',              term:2, displayOrder:5 },
  { id:'mz6port-6', subjectId:'mz6-port', title:'Discurso Directo, Indirecto e Indirecto Livre', description:'Formas de relatar a fala',                   term:2, displayOrder:6 },
  { id:'mz6port-7', subjectId:'mz6-port', title:'Produção de Textos Diversos',    description:'Carta, relatório e redacção',                              term:3, displayOrder:7 },
  { id:'mz6port-8', subjectId:'mz6-port', title:'Figuras de Estilo Simples',      description:'Metáfora, comparação e personificação',                    term:3, displayOrder:8 },
  { id:'mz6port-9', subjectId:'mz6-port', title:'Revisão para a Conclusão do Ensino Primário', description:'Preparação para o exame da 6ª classe',        term:3, displayOrder:9 },

  // ─── 6ª Classe — Matemática ───────────────────────────────
  { id:'mz6mat-1', subjectId:'mz6-mat', title:'Operações com Números Decimais',  description:'Adição, subtracção, multiplicação e divisão',              term:1, displayOrder:1 },
  { id:'mz6mat-2', subjectId:'mz6-mat', title:'Fracções Equivalentes e Operações', description:'Comparação e operações com fracções',                    term:1, displayOrder:2 },
  { id:'mz6mat-3', subjectId:'mz6-mat', title:'Perímetro, Área e Volume',        description:'Cálculo aplicado a figuras e sólidos',                     term:1, displayOrder:3 },
  { id:'mz6mat-4', subjectId:'mz6-mat', title:'Proporcionalidade e Regra de Três Simples', description:'Resolução de problemas proporcionais',            term:2, displayOrder:4 },
  { id:'mz6mat-5', subjectId:'mz6-mat', title:'Percentagem',                     description:'Cálculos aplicados de percentagem',                        term:2, displayOrder:5 },
  { id:'mz6mat-6', subjectId:'mz6-mat', title:'Ângulos e Polígonos',             description:'Classificação e propriedades',                             term:2, displayOrder:6 },
  { id:'mz6mat-7', subjectId:'mz6-mat', title:'Estatística',                     description:'Gráficos e interpretação de dados',                        term:3, displayOrder:7 },
  { id:'mz6mat-8', subjectId:'mz6-mat', title:'Literacia Financeira',            description:'Orçamento simples e resolução de problemas',                term:3, displayOrder:8 },
  { id:'mz6mat-9', subjectId:'mz6-mat', title:'Revisão para a Conclusão do Ensino Primário', description:'Preparação para o exame da 6ª classe',          term:3, displayOrder:9 },

  // ─── 6ª Classe — Ciências Sociais ─────────────────────────
  { id:'mz6cs-1', subjectId:'mz6-cs', title:'Moçambique e a Região Austral de África', description:'Geografia física e humana regional',                 term:1, displayOrder:1 },
  { id:'mz6cs-2', subjectId:'mz6-cs', title:'Recursos Naturais e Desenvolvimento Económico', description:'Sectores produtivos do país',                    term:1, displayOrder:2 },
  { id:'mz6cs-3', subjectId:'mz6-cs', title:'Independência de Moçambique',       description:'Processo histórico da luta de libertação',                  term:2, displayOrder:3 },
  { id:'mz6cs-4', subjectId:'mz6-cs', title:'Instituições do Estado e Cidadania', description:'Organização do Estado moçambicano',                       term:2, displayOrder:4 },
  { id:'mz6cs-5', subjectId:'mz6-cs', title:'Direitos Humanos, Democracia e Cultura de Paz', description:'Valores de cidadania responsável',                 term:3, displayOrder:5 },
  { id:'mz6cs-6', subjectId:'mz6-cs', title:'Moçambique no Mundo',               description:'Relações internacionais básicas',                          term:3, displayOrder:6 },

  // ─── 6ª Classe — Ciências Naturais ────────────────────────
  { id:'mz6cn-1', subjectId:'mz6-cn', title:'Sistemas do Corpo Humano',          description:'Sistema circulatório e nervoso',                           term:1, displayOrder:1 },
  { id:'mz6cn-2', subjectId:'mz6-cn', title:'Saúde Reprodutiva',                 description:'Noções adequadas à idade',                                 term:1, displayOrder:2 },
  { id:'mz6cn-3', subjectId:'mz6-cn', title:'Ambiente e Alterações Climáticas',  description:'Impacto humano no ambiente',                               term:2, displayOrder:3 },
  { id:'mz6cn-4', subjectId:'mz6-cn', title:'Ciência, Tecnologia e Sociedade',   description:'Relação entre ciência e vida quotidiana',                  term:2, displayOrder:4 },
  { id:'mz6cn-5', subjectId:'mz6-cn', title:'Conservação da Biodiversidade em Moçambique', description:'Fauna, flora e áreas protegidas',                 term:3, displayOrder:5 },
  { id:'mz6cn-6', subjectId:'mz6-cn', title:'Revisão de Ciências Naturais',      description:'Consolidação para o fim do Ensino Primário',                term:3, displayOrder:6 },

  // ─── 6ª Classe — Educação Visual e Ofícios ────────────────
  { id:'mz6evo-1', subjectId:'mz6-evo', title:'Desenho Técnico Simples',        description:'Uso de régua, esquadro e transferidor',                     term:1, displayOrder:1 },
  { id:'mz6evo-2', subjectId:'mz6-evo', title:'Artesanato e Marcenaria Básica', description:'Trabalhos manuais com madeira e materiais locais',          term:1, displayOrder:2 },
  { id:'mz6evo-3', subjectId:'mz6-evo', title:'Culinária, Criação de Animais e Agricultura', description:'Actividades práticas ligadas à comunidade',      term:2, displayOrder:3 },
  { id:'mz6evo-4', subjectId:'mz6-evo', title:'Costura e Trabalhos Manuais',    description:'Técnicas simples de costura',                                term:2, displayOrder:4 },
  { id:'mz6evo-5', subjectId:'mz6-evo', title:'Projecto Criativo Final',        description:'Planificação e execução de um projecto',                     term:3, displayOrder:5 },
  { id:'mz6evo-6', subjectId:'mz6-evo', title:'Apreciação e Exposição de Trabalhos', description:'Avaliação crítica das produções da turma',              term:3, displayOrder:6 },

  // ══════════════════════════════════════════════════════════
  //  MOÇAMBIQUE 8ª Classe (ESG1 — 1º Ciclo)
  // ══════════════════════════════════════════════════════════
  { id:'mz8mat-1', subjectId:'mz8-mat', title:'Conjuntos Numéricos',            description:'Naturais, inteiros, racionais e irracionais',                term:1, displayOrder:1 },
  { id:'mz8mat-2', subjectId:'mz8-mat', title:'Potenciação e Radiciação',       description:'Propriedades e cálculo',                                     term:1, displayOrder:2 },
  { id:'mz8mat-3', subjectId:'mz8-mat', title:'Equações do 1º Grau',           description:'Resolução e problemas do quotidiano',                        term:2, displayOrder:3 },
  { id:'mz8mat-4', subjectId:'mz8-mat', title:'Funções',                       description:'Noção de função e representação gráfica',                    term:2, displayOrder:4 },
  { id:'mz8mat-5', subjectId:'mz8-mat', title:'Trigonometria Inicial',         description:'Razões trigonométricas no triângulo rectângulo',             term:3, displayOrder:5 },
  { id:'mz8mat-6', subjectId:'mz8-mat', title:'Estatística Descritiva',        description:'Recolha, organização e representação de dados',              term:3, displayOrder:6 },

  { id:'mz8port-1', subjectId:'mz8-port', title:'Classes de Palavras',         description:'Revisão e aprofundamento',                                    term:1, displayOrder:1 },
  { id:'mz8port-2', subjectId:'mz8-port', title:'Texto Narrativo',             description:'Estrutura e elementos da narrativa',                         term:1, displayOrder:2 },
  { id:'mz8port-3', subjectId:'mz8-port', title:'Texto Descritivo',            description:'Técnicas de descrição',                                       term:2, displayOrder:3 },
  { id:'mz8port-4', subjectId:'mz8-port', title:'Análise Sintáctica',          description:'Sujeito e predicado',                                         term:2, displayOrder:4 },
  { id:'mz8port-5', subjectId:'mz8-port', title:'Literatura Moçambicana',      description:'Introdução a autores nacionais',                              term:3, displayOrder:5 },
  { id:'mz8port-6', subjectId:'mz8-port', title:'Produção Textual',            description:'Redacção e correcção de textos',                              term:3, displayOrder:6 },

  { id:'mz8fis-1', subjectId:'mz8-fis', title:'Grandezas Físicas e Unidades',  description:'Sistema Internacional de Unidades',                          term:1, displayOrder:1 },
  { id:'mz8fis-2', subjectId:'mz8-fis', title:'Medição e Instrumentos',       description:'Precisão e erro experimental',                                term:1, displayOrder:2 },
  { id:'mz8fis-3', subjectId:'mz8-fis', title:'Estados da Matéria',           description:'Sólido, líquido e gasoso',                                    term:2, displayOrder:3 },
  { id:'mz8fis-4', subjectId:'mz8-fis', title:'Movimento',                    description:'Noções de trajectória e velocidade',                          term:2, displayOrder:4 },
  { id:'mz8fis-5', subjectId:'mz8-fis', title:'Força e Equilíbrio',           description:'Noções elementares de força',                                 term:3, displayOrder:5 },
  { id:'mz8fis-6', subjectId:'mz8-fis', title:'Energia',                      description:'Formas e transformações de energia',                          term:3, displayOrder:6 },

  { id:'mz8qui-1', subjectId:'mz8-qui', title:'A Matéria e as suas Propriedades', description:'Propriedades gerais e específicas',                       term:1, displayOrder:1 },
  { id:'mz8qui-2', subjectId:'mz8-qui', title:'Estados Físicos e Mudanças de Estado', description:'Fusão, ebulição, condensação e solidificação',           term:1, displayOrder:2 },
  { id:'mz8qui-3', subjectId:'mz8-qui', title:'Misturas e Métodos de Separação', description:'Filtração, decantação e destilação',                       term:2, displayOrder:3 },
  { id:'mz8qui-4', subjectId:'mz8-qui', title:'Átomos e Elementos Químicos',  description:'Estrutura atómica elementar',                                 term:2, displayOrder:4 },
  { id:'mz8qui-5', subjectId:'mz8-qui', title:'Substâncias Simples e Compostas', description:'Diferenças e exemplos do quotidiano',                       term:3, displayOrder:5 },
  { id:'mz8qui-6', subjectId:'mz8-qui', title:'Introdução às Reacções Químicas', description:'Reagentes, produtos e sinais de reacção',                  term:3, displayOrder:6 },

  { id:'mz8bio-1', subjectId:'mz8-bio', title:'Níveis de Organização dos Seres Vivos', description:'Célula, tecido, órgão, sistema e organismo',            term:1, displayOrder:1 },
  { id:'mz8bio-2', subjectId:'mz8-bio', title:'A Célula — Estrutura Básica',  description:'Membrana, citoplasma e núcleo',                               term:1, displayOrder:2 },
  { id:'mz8bio-3', subjectId:'mz8-bio', title:'Tecidos Animais e Vegetais',   description:'Tipos e funções básicas',                                     term:2, displayOrder:3 },
  { id:'mz8bio-4', subjectId:'mz8-bio', title:'Funções Vitais dos Seres Vivos', description:'Nutrição, relação e reprodução',                             term:2, displayOrder:4 },
  { id:'mz8bio-5', subjectId:'mz8-bio', title:'Classificação dos Seres Vivos', description:'Reinos e critérios de classificação',                        term:3, displayOrder:5 },
  { id:'mz8bio-6', subjectId:'mz8-bio', title:'Saúde e Higiene',              description:'Prevenção de doenças e boas práticas de saúde',               term:3, displayOrder:6 },

  { id:'mz8geo-1', subjectId:'mz8-geo', title:'Moçambique — Localização e Limites', description:'Posição geográfica e fronteiras',                        term:1, displayOrder:1 },
  { id:'mz8geo-2', subjectId:'mz8-geo', title:'Relevo de Moçambique',         description:'Planícies, planaltos e montanhas',                            term:1, displayOrder:2 },
  { id:'mz8geo-3', subjectId:'mz8-geo', title:'Clima e Vegetação',            description:'Tipos de clima e cobertura vegetal',                          term:2, displayOrder:3 },
  { id:'mz8geo-4', subjectId:'mz8-geo', title:'Hidrografia de Moçambique',    description:'Principais rios e bacias hidrográficas',                      term:2, displayOrder:4 },
  { id:'mz8geo-5', subjectId:'mz8-geo', title:'Recursos Naturais',            description:'Minerais, florestas e recursos hídricos',                     term:3, displayOrder:5 },
  { id:'mz8geo-6', subjectId:'mz8-geo', title:'Cartografia e Orientação',     description:'Leitura de mapas e pontos cardeais',                          term:3, displayOrder:6 },

  { id:'mz8his-1', subjectId:'mz8-his', title:'Origem do Homem e Pré-História', description:'Evolução humana e períodos pré-históricos',                 term:1, displayOrder:1 },
  { id:'mz8his-2', subjectId:'mz8-his', title:'Primeiras Civilizações',       description:'Mesopotâmia, Egipto e vale do Indo',                          term:1, displayOrder:2 },
  { id:'mz8his-3', subjectId:'mz8-his', title:'Civilizações Africanas Antigas', description:'Reinos e impérios africanos',                                term:2, displayOrder:3 },
  { id:'mz8his-4', subjectId:'mz8-his', title:'Sociedades Bantu em Moçambique', description:'Organização social e económica',                            term:2, displayOrder:4 },
  { id:'mz8his-5', subjectId:'mz8-his', title:'Comércio e Trocas na Costa Africana', description:'Rotas comerciais do Índico',                             term:3, displayOrder:5 },
  { id:'mz8his-6', subjectId:'mz8-his', title:'Revisão — Da Pré-História às Sociedades Antigas', description:'Consolidação dos temas do ano',              term:3, displayOrder:6 },

  { id:'mz8ing-1', subjectId:'mz8-ing', title:'Greetings and Introductions',  description:'Cumprimentos e apresentação pessoal',                         term:1, displayOrder:1 },
  { id:'mz8ing-2', subjectId:'mz8-ing', title:'Family and Daily Life',        description:'Vocabulário sobre família e rotina',                          term:1, displayOrder:2 },
  { id:'mz8ing-3', subjectId:'mz8-ing', title:'Present Simple Tense',         description:'Formação e uso do presente simples',                          term:2, displayOrder:3 },
  { id:'mz8ing-4', subjectId:'mz8-ing', title:'Numbers, Time and Dates',      description:'Números, horas e datas',                                      term:2, displayOrder:4 },
  { id:'mz8ing-5', subjectId:'mz8-ing', title:'School and Environment Vocabulary', description:'Vocabulário escolar e ambiental',                        term:3, displayOrder:5 },
  { id:'mz8ing-6', subjectId:'mz8-ing', title:'Basic Reading Comprehension',  description:'Compreensão de textos simples',                               term:3, displayOrder:6 },

  { id:'mz8ev-1', subjectId:'mz8-ev', title:'Desenho de Observação',         description:'Registo gráfico de objectos reais',                           term:1, displayOrder:1 },
  { id:'mz8ev-2', subjectId:'mz8-ev', title:'Cor e Composição',              description:'Teoria da cor e organização visual',                          term:1, displayOrder:2 },
  { id:'mz8ev-3', subjectId:'mz8-ev', title:'Técnicas de Pintura',           description:'Aguarela, guache e outras técnicas',                          term:2, displayOrder:3 },
  { id:'mz8ev-4', subjectId:'mz8-ev', title:'Desenho Geométrico Inicial',    description:'Traçados com régua, esquadro e compasso',                     term:2, displayOrder:4 },
  { id:'mz8ev-5', subjectId:'mz8-ev', title:'Materiais e Texturas',          description:'Exploração de materiais diversos',                            term:3, displayOrder:5 },
  { id:'mz8ev-6', subjectId:'mz8-ev', title:'Projecto de Expressão Plástica', description:'Planificação e execução de um trabalho final',              term:3, displayOrder:6 },

  { id:'mz8tic-1', subjectId:'mz8-tic', title:'Introdução ao Computador e Componentes', description:'Hardware e software básicos',                        term:1, displayOrder:1 },
  { id:'mz8tic-2', subjectId:'mz8-tic', title:'Sistemas Operativos — Noções Básicas', description:'Funcionamento e organização de ficheiros',                term:1, displayOrder:2 },
  { id:'mz8tic-3', subjectId:'mz8-tic', title:'Processamento de Texto',      description:'Criação e formatação de documentos',                          term:2, displayOrder:3 },
  { id:'mz8tic-4', subjectId:'mz8-tic', title:'Folhas de Cálculo — Introdução', description:'Células, fórmulas simples e gráficos',                     term:2, displayOrder:4 },
  { id:'mz8tic-5', subjectId:'mz8-tic', title:'Internet e Pesquisa de Informação', description:'Navegação e critérios de pesquisa',                       term:3, displayOrder:5 },
  { id:'mz8tic-6', subjectId:'mz8-tic', title:'Segurança e Ética Digital',   description:'Boas práticas online e protecção de dados',                   term:3, displayOrder:6 },

  { id:'mz8emp-1', subjectId:'mz8-emp', title:'O que é Empreendedorismo',    description:'Conceitos e importância para a comunidade',                   term:1, displayOrder:1 },
  { id:'mz8emp-2', subjectId:'mz8-emp', title:'Identificação de Oportunidades Locais', description:'Análise do meio envolvente',                          term:1, displayOrder:2 },
  { id:'mz8emp-3', subjectId:'mz8-emp', title:'Ideias de Negócio',           description:'Geração e selecção de ideias',                                term:2, displayOrder:3 },
  { id:'mz8emp-4', subjectId:'mz8-emp', title:'Planeamento de uma Actividade', description:'Passos para organizar uma iniciativa',                       term:2, displayOrder:4 },
  { id:'mz8emp-5', subjectId:'mz8-emp', title:'Noções de Custo e Preço',     description:'Cálculo simples de custos e margem',                          term:3, displayOrder:5 },
  { id:'mz8emp-6', subjectId:'mz8-emp', title:'Apresentação de um Projecto Simples', description:'Comunicação de uma ideia de negócio',                    term:3, displayOrder:6 },

  { id:'mz8agro-1', subjectId:'mz8-agro', title:'Introdução à Agricultura',  description:'Importância da agricultura para Moçambique',                  term:1, displayOrder:1 },
  { id:'mz8agro-2', subjectId:'mz8-agro', title:'Preparação do Solo',       description:'Técnicas de preparação para cultivo',                          term:1, displayOrder:2 },
  { id:'mz8agro-3', subjectId:'mz8-agro', title:'Sementeira e Cultivo',     description:'Técnicas básicas de plantio',                                  term:2, displayOrder:3 },
  { id:'mz8agro-4', subjectId:'mz8-agro', title:'Criação de Pequenos Animais', description:'Aves e outros pequenos animais',                             term:2, displayOrder:4 },
  { id:'mz8agro-5', subjectId:'mz8-agro', title:'Conservação de Produtos Agrícolas', description:'Métodos de armazenamento',                              term:3, displayOrder:5 },
  { id:'mz8agro-6', subjectId:'mz8-agro', title:'Segurança Alimentar',      description:'Produção e acesso a alimentos',                                term:3, displayOrder:6 },

  // ══════════════════════════════════════════════════════════
  //  MOÇAMBIQUE 9ª Classe (ESG1 — 1º Ciclo)
  // ══════════════════════════════════════════════════════════
  { id:'mz9mat-1', subjectId:'mz9-mat', title:'Equações do 2º Grau',         description:'Fórmula resolvente e problemas',                              term:1, displayOrder:1 },
  { id:'mz9mat-2', subjectId:'mz9-mat', title:'Sistemas de Equações Lineares', description:'Métodos de resolução',                                      term:1, displayOrder:2 },
  { id:'mz9mat-3', subjectId:'mz9-mat', title:'Funções Quadráticas',         description:'Representação gráfica e vértice da parábola',                 term:2, displayOrder:3 },
  { id:'mz9mat-4', subjectId:'mz9-mat', title:'Semelhança de Triângulos',    description:'Critérios de semelhança e aplicações',                        term:2, displayOrder:4 },
  { id:'mz9mat-5', subjectId:'mz9-mat', title:'Teorema de Pitágoras',        description:'Demonstração e aplicações práticas',                          term:3, displayOrder:5 },
  { id:'mz9mat-6', subjectId:'mz9-mat', title:'Estatística e Probabilidade Inicial', description:'Medidas de tendência central e noção de probabilidade', term:3, displayOrder:6 },

  { id:'mz9port-1', subjectId:'mz9-port', title:'Texto Argumentativo',       description:'Estrutura e construção de argumentos',                        term:1, displayOrder:1 },
  { id:'mz9port-2', subjectId:'mz9-port', title:'Orações Coordenadas e Subordinadas', description:'Tipos e funções sintácticas',                          term:1, displayOrder:2 },
  { id:'mz9port-3', subjectId:'mz9-port', title:'Literatura Moçambicana — Poesia', description:'Craveirinha e outros poetas nacionais',                    term:2, displayOrder:3 },
  { id:'mz9port-4', subjectId:'mz9-port', title:'Discurso Directo e Indirecto', description:'Transformação e uso em textos',                              term:2, displayOrder:4 },
  { id:'mz9port-5', subjectId:'mz9-port', title:'Produção de Textos de Opinião', description:'Defesa de um ponto de vista',                                term:3, displayOrder:5 },
  { id:'mz9port-6', subjectId:'mz9-port', title:'Revisão Gramatical Geral',  description:'Consolidação das classes e funções gramaticais',              term:3, displayOrder:6 },

  { id:'mz9fis-1', subjectId:'mz9-fis', title:'Cinemática — Movimento Rectilíneo', description:'Posição, deslocamento e trajectória',                     term:1, displayOrder:1 },
  { id:'mz9fis-2', subjectId:'mz9-fis', title:'Velocidade e Aceleração',    description:'Cálculo e interpretação de gráficos',                          term:1, displayOrder:2 },
  { id:'mz9fis-3', subjectId:'mz9-fis', title:'Leis de Newton — Introdução', description:'Inércia, força e acção-reacção',                              term:2, displayOrder:3 },
  { id:'mz9fis-4', subjectId:'mz9-fis', title:'Força e Massa',              description:'Relação entre força, massa e aceleração',                      term:2, displayOrder:4 },
  { id:'mz9fis-5', subjectId:'mz9-fis', title:'Trabalho e Energia Mecânica', description:'Energia cinética e potencial',                                term:3, displayOrder:5 },
  { id:'mz9fis-6', subjectId:'mz9-fis', title:'Máquinas Simples',           description:'Alavancas, roldanas e planos inclinados',                      term:3, displayOrder:6 },

  { id:'mz9qui-1', subjectId:'mz9-qui', title:'Tabela Periódica — Organização', description:'Períodos, grupos e classificação dos elementos',            term:1, displayOrder:1 },
  { id:'mz9qui-2', subjectId:'mz9-qui', title:'Propriedades Periódicas',    description:'Raio atómico, electronegatividade e energia de ionização',    term:1, displayOrder:2 },
  { id:'mz9qui-3', subjectId:'mz9-qui', title:'Ligação Iónica e Covalente', description:'Formação e características das ligações',                     term:2, displayOrder:3 },
  { id:'mz9qui-4', subjectId:'mz9-qui', title:'Fórmulas Químicas',          description:'Escrita e interpretação de fórmulas',                          term:2, displayOrder:4 },
  { id:'mz9qui-5', subjectId:'mz9-qui', title:'Reacções Químicas — Tipos',  description:'Síntese, decomposição, deslocamento e dupla troca',           term:3, displayOrder:5 },
  { id:'mz9qui-6', subjectId:'mz9-qui', title:'Balanceamento de Equações Químicas', description:'Conservação da massa e coeficientes estequiométricos',   term:3, displayOrder:6 },

  { id:'mz9bio-1', subjectId:'mz9-bio', title:'Reprodução nos Seres Vivos', description:'Reprodução sexuada e assexuada',                              term:1, displayOrder:1 },
  { id:'mz9bio-2', subjectId:'mz9-bio', title:'Reprodução Humana',         description:'Sistema reprodutor e ciclo reprodutivo',                       term:1, displayOrder:2 },
  { id:'mz9bio-3', subjectId:'mz9-bio', title:'Hereditariedade — Noções Básicas', description:'Transmissão de características entre gerações',           term:2, displayOrder:3 },
  { id:'mz9bio-4', subjectId:'mz9-bio', title:'Genes e Cromossomas',       description:'Localização da informação genética',                          term:2, displayOrder:4 },
  { id:'mz9bio-5', subjectId:'mz9-bio', title:'Saúde Reprodutiva e Prevenção de Doenças', description:'Comportamento sexual responsável',                    term:3, displayOrder:5 },
  { id:'mz9bio-6', subjectId:'mz9-bio', title:'Ecossistemas e Cadeias Alimentares', description:'Relações entre seres vivos e ambiente',                    term:3, displayOrder:6 },

  { id:'mz9geo-1', subjectId:'mz9-geo', title:'População de Moçambique',   description:'Distribuição e crescimento populacional',                      term:1, displayOrder:1 },
  { id:'mz9geo-2', subjectId:'mz9-geo', title:'Urbanização e Migrações',   description:'Movimentos populacionais e crescimento urbano',               term:1, displayOrder:2 },
  { id:'mz9geo-3', subjectId:'mz9-geo', title:'Actividades Económicas — Agricultura e Pesca', description:'Principais sectores produtivos',                   term:2, displayOrder:3 },
  { id:'mz9geo-4', subjectId:'mz9-geo', title:'Indústria e Comércio',      description:'Sectores secundário e terciário em Moçambique',                term:2, displayOrder:4 },
  { id:'mz9geo-5', subjectId:'mz9-geo', title:'Transportes e Comunicações', description:'Redes de infra-estruturas do país',                            term:3, displayOrder:5 },
  { id:'mz9geo-6', subjectId:'mz9-geo', title:'Moçambique na SADC',        description:'Cooperação regional austral-africana',                         term:3, displayOrder:6 },

  { id:'mz9his-1', subjectId:'mz9-his', title:'Chegada dos Portugueses a Moçambique', description:'Primeiros contactos e feitorias',                       term:1, displayOrder:1 },
  { id:'mz9his-2', subjectId:'mz9-his', title:'Sistema Colonial Português', description:'Estrutura administrativa e económica colonial',               term:1, displayOrder:2 },
  { id:'mz9his-3', subjectId:'mz9-his', title:'Resistência à Ocupação Colonial', description:'Movimentos e figuras de resistência',                       term:2, displayOrder:3 },
  { id:'mz9his-4', subjectId:'mz9-his', title:'Surgimento do Nacionalismo Moçambicano', description:'Contexto e primeiros movimentos nacionalistas',          term:2, displayOrder:4 },
  { id:'mz9his-5', subjectId:'mz9-his', title:'Fundação da FRELIMO',       description:'Unificação dos movimentos nacionalistas',                      term:3, displayOrder:5 },
  { id:'mz9his-6', subjectId:'mz9-his', title:'Luta Armada de Libertação Nacional', description:'Principais fases da luta armada',                          term:3, displayOrder:6 },

  { id:'mz9ing-1', subjectId:'mz9-ing', title:'Past Simple Tense',         description:'Formação e uso do passado simples',                            term:1, displayOrder:1 },
  { id:'mz9ing-2', subjectId:'mz9-ing', title:'Comparatives and Superlatives', description:'Comparação de adjectivos',                                    term:1, displayOrder:2 },
  { id:'mz9ing-3', subjectId:'mz9-ing', title:'Describing People and Places', description:'Adjectivos descritivos',                                       term:2, displayOrder:3 },
  { id:'mz9ing-4', subjectId:'mz9-ing', title:'Future Plans — Going to / Will', description:'Expressão de planos futuros',                                term:2, displayOrder:4 },
  { id:'mz9ing-5', subjectId:'mz9-ing', title:'Reading — Short Stories',   description:'Compreensão de pequenas histórias',                            term:3, displayOrder:5 },
  { id:'mz9ing-6', subjectId:'mz9-ing', title:'Writing — Personal Letters', description:'Estrutura de cartas pessoais',                                  term:3, displayOrder:6 },

  { id:'mz9ev-1', subjectId:'mz9-ev', title:'Desenho Técnico — Instrumentos e Traçados', description:'Uso de régua, esquadro e compasso',                     term:1, displayOrder:1 },
  { id:'mz9ev-2', subjectId:'mz9-ev', title:'Perspectiva — Noções Iniciais', description:'Profundidade e ponto de fuga',                                 term:1, displayOrder:2 },
  { id:'mz9ev-3', subjectId:'mz9-ev', title:'Escultura e Modelagem',       description:'Trabalhos tridimensionais',                                    term:2, displayOrder:3 },
  { id:'mz9ev-4', subjectId:'mz9-ev', title:'Design e Comunicação Visual', description:'Elementos gráficos e mensagem visual',                          term:2, displayOrder:4 },
  { id:'mz9ev-5', subjectId:'mz9-ev', title:'Cor Aplicada ao Desenho Técnico', description:'Uso da cor em representações técnicas',                       term:3, displayOrder:5 },
  { id:'mz9ev-6', subjectId:'mz9-ev', title:'Projecto de Expressão Plástica', description:'Planificação e execução de um trabalho final',                term:3, displayOrder:6 },

  { id:'mz9tic-1', subjectId:'mz9-tic', title:'Apresentações Digitais',    description:'Criação de slides e recursos visuais',                         term:1, displayOrder:1 },
  { id:'mz9tic-2', subjectId:'mz9-tic', title:'Folhas de Cálculo — Fórmulas Básicas', description:'Cálculos e funções simples',                              term:1, displayOrder:2 },
  { id:'mz9tic-3', subjectId:'mz9-tic', title:'Bases de Dados — Noções Iniciais', description:'Organização de informação em tabelas',                       term:2, displayOrder:3 },
  { id:'mz9tic-4', subjectId:'mz9-tic', title:'Comunicação Digital e Correio Electrónico', description:'Boas práticas de comunicação online',                    term:2, displayOrder:4 },
  { id:'mz9tic-5', subjectId:'mz9-tic', title:'Pesquisa Avançada de Informação', description:'Critérios de fiabilidade das fontes',                        term:3, displayOrder:5 },
  { id:'mz9tic-6', subjectId:'mz9-tic', title:'Ética e Segurança na Internet', description:'Uso responsável das tecnologias digitais',                     term:3, displayOrder:6 },

  { id:'mz9emp-1', subjectId:'mz9-emp', title:'Gestão de Pequenos Negócios', description:'Princípios básicos de gestão',                                 term:1, displayOrder:1 },
  { id:'mz9emp-2', subjectId:'mz9-emp', title:'Marketing Básico',          description:'Identificação de clientes e divulgação',                       term:1, displayOrder:2 },
  { id:'mz9emp-3', subjectId:'mz9-emp', title:'Noções de Contabilidade Simples', description:'Registo de receitas e despesas',                            term:2, displayOrder:3 },
  { id:'mz9emp-4', subjectId:'mz9-emp', title:'Legislação Comercial Básica', description:'Noções de licenciamento e impostos',                            term:2, displayOrder:4 },
  { id:'mz9emp-5', subjectId:'mz9-emp', title:'Trabalho em Equipa e Liderança', description:'Competências para gerir pessoas',                              term:3, displayOrder:5 },
  { id:'mz9emp-6', subjectId:'mz9-emp', title:'Elaboração de um Plano de Negócio Simples', description:'Estrutura de um plano de negócio',                    term:3, displayOrder:6 },

  { id:'mz9agro-1', subjectId:'mz9-agro', title:'Técnicas de Cultivo Melhoradas', description:'Rotação de culturas e adubação',                            term:1, displayOrder:1 },
  { id:'mz9agro-2', subjectId:'mz9-agro', title:'Pragas e Doenças das Plantas', description:'Identificação e controlo básico',                             term:1, displayOrder:2 },
  { id:'mz9agro-3', subjectId:'mz9-agro', title:'Criação de Gado — Noções Básicas', description:'Maneio de bovinos e caprinos',                              term:2, displayOrder:3 },
  { id:'mz9agro-4', subjectId:'mz9-agro', title:'Conservação e Armazenamento de Alimentos', description:'Técnicas de conservação pós-colheita',                  term:2, displayOrder:4 },
  { id:'mz9agro-5', subjectId:'mz9-agro', title:'Comercialização de Produtos Agro-Pecuários', description:'Do produtor ao mercado',                              term:3, displayOrder:5 },
  { id:'mz9agro-6', subjectId:'mz9-agro', title:'Sustentabilidade e Ambiente na Agricultura', description:'Práticas agrícolas sustentáveis',                        term:3, displayOrder:6 },

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

  // ─── Ed. Moral e Cívica 10ª Classe ─────────────────────────
  { id:'mz10edm-1', subjectId:'mz10-edm', title:'Direitos Humanos e Constituição',       description:'Constituição da República e direitos fundamentais',              term:1, displayOrder:1 },
  { id:'mz10edm-2', subjectId:'mz10-edm', title:'Cidadania e Participação Democrática',  description:'Deveres cívicos e participação na vida pública',                  term:1, displayOrder:2 },
  { id:'mz10edm-3', subjectId:'mz10-edm', title:'Valores Éticos e Morais',                description:'Honestidade, responsabilidade e integridade',                     term:2, displayOrder:3 },
  { id:'mz10edm-4', subjectId:'mz10-edm', title:'Diversidade Cultural e Tolerância',      description:'Respeito pela diversidade cultural e religiosa',                  term:2, displayOrder:4 },
  { id:'mz10edm-5', subjectId:'mz10-edm', title:'Saúde, Sexualidade e Prevenção',         description:'Comportamento sexual responsável e prevenção de doenças',         term:3, displayOrder:5 },
  { id:'mz10edm-6', subjectId:'mz10-edm', title:'Ambiente e Desenvolvimento Sustentável', description:'Responsabilidade ambiental e sustentabilidade',                    term:3, displayOrder:6 },

  // ─── Educação Visual 10ª Classe ─────────────────────────────
  { id:'mz10ev-1', subjectId:'mz10-ev', title:'Desenho de Projecção — Vistas Ortogonais', description:'Representação de objectos em várias vistas',                  term:1, displayOrder:1 },
  { id:'mz10ev-2', subjectId:'mz10-ev', title:'Perspectiva Cónica e Cavaleira',          description:'Métodos de representação em profundidade',                        term:1, displayOrder:2 },
  { id:'mz10ev-3', subjectId:'mz10-ev', title:'Cor, Luz e Sombra',                       description:'Efeitos de luz e volume no desenho',                              term:2, displayOrder:3 },
  { id:'mz10ev-4', subjectId:'mz10-ev', title:'Composição e Design Gráfico',             description:'Princípios de composição visual',                                 term:2, displayOrder:4 },
  { id:'mz10ev-5', subjectId:'mz10-ev', title:'Materiais Convencionais e Reciclados',    description:'Exploração de novos materiais',                                   term:3, displayOrder:5 },
  { id:'mz10ev-6', subjectId:'mz10-ev', title:'Projecto de Expressão Plástica',          description:'Planificação e execução de um trabalho final',                    term:3, displayOrder:6 },

  // ─── TIC 10ª Classe ──────────────────────────────────────────
  { id:'mz10tic-1', subjectId:'mz10-tic', title:'Sistemas de Informação — Conceitos',     description:'Fundamentos de sistemas de informação',                          term:1, displayOrder:1 },
  { id:'mz10tic-2', subjectId:'mz10-tic', title:'Processamento e Organização de Dados',   description:'Estruturação e tratamento de dados',                              term:1, displayOrder:2 },
  { id:'mz10tic-3', subjectId:'mz10-tic', title:'Folhas de Cálculo Aplicadas',            description:'Fórmulas, funções e gráficos avançados',                          term:2, displayOrder:3 },
  { id:'mz10tic-4', subjectId:'mz10-tic', title:'Apresentações e Comunicação Digital',    description:'Recursos multimédia para comunicação',                            term:2, displayOrder:4 },
  { id:'mz10tic-5', subjectId:'mz10-tic', title:'Introdução à Programação',               description:'Lógica de programação e algoritmos simples',                      term:3, displayOrder:5 },
  { id:'mz10tic-6', subjectId:'mz10-tic', title:'Segurança da Informação',                description:'Protecção de dados e boas práticas digitais',                     term:3, displayOrder:6 },

  // ─── Noções de Empreendedorismo 10ª Classe ──────────────────
  { id:'mz10emp-1', subjectId:'mz10-emp', title:'O Espírito Empreendedor',               description:'Atitudes e características do empreendedor',                     term:1, displayOrder:1 },
  { id:'mz10emp-2', subjectId:'mz10-emp', title:'Identificação de Oportunidades de Negócio', description:'Análise do mercado e necessidades locais',                     term:1, displayOrder:2 },
  { id:'mz10emp-3', subjectId:'mz10-emp', title:'Elaboração de um Plano de Negócio',      description:'Estrutura e componentes de um plano de negócio',                  term:2, displayOrder:3 },
  { id:'mz10emp-4', subjectId:'mz10-emp', title:'Gestão Financeira Básica',               description:'Receitas, despesas e fluxo de caixa',                             term:2, displayOrder:4 },
  { id:'mz10emp-5', subjectId:'mz10-emp', title:'Marketing e Vendas',                     description:'Estratégias de divulgação e venda',                               term:3, displayOrder:5 },
  { id:'mz10emp-6', subjectId:'mz10-emp', title:'Ética e Responsabilidade Empresarial',   description:'Boas práticas no exercício de uma actividade',                    term:3, displayOrder:6 },

  // ─── Agro-Pecuária 10ª Classe ────────────────────────────────
  { id:'mz10agro-1', subjectId:'mz10-agro', title:'Sistemas de Produção Agrícola',        description:'Modelos de produção agrícola em Moçambique',                     term:1, displayOrder:1 },
  { id:'mz10agro-2', subjectId:'mz10-agro', title:'Maneio de Culturas e Irrigação',       description:'Técnicas de rega e manutenção de culturas',                       term:1, displayOrder:2 },
  { id:'mz10agro-3', subjectId:'mz10-agro', title:'Produção Pecuária — Bovinos e Aves',   description:'Boas práticas de criação animal',                                 term:2, displayOrder:3 },
  { id:'mz10agro-4', subjectId:'mz10-agro', title:'Conservação de Produtos Agro-Pecuários', description:'Métodos de conservação pós-colheita',                           term:2, displayOrder:4 },
  { id:'mz10agro-5', subjectId:'mz10-agro', title:'Comercialização e Mercado',            description:'Do produtor ao consumidor',                                       term:3, displayOrder:5 },
  { id:'mz10agro-6', subjectId:'mz10-agro', title:'Agricultura Sustentável e Ambiente',   description:'Impacto ambiental e boas práticas',                               term:3, displayOrder:6 },

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

  // ─── Introdução à Filosofia 11ª Classe ──────────────────────
  { id:'mz11fil-1', subjectId:'mz11-fil', title:'O que é Filosofia',                     description:'Origem, objecto e método da reflexão filosófica',                 term:1, displayOrder:1 },
  { id:'mz11fil-2', subjectId:'mz11-fil', title:'O Conhecimento e a Verdade',            description:'Teorias do conhecimento',                                          term:1, displayOrder:2 },
  { id:'mz11fil-3', subjectId:'mz11-fil', title:'Lógica e Argumentação',                 description:'Estrutura de argumentos válidos e falácias',                       term:2, displayOrder:3 },
  { id:'mz11fil-4', subjectId:'mz11-fil', title:'Ética e Moral',                         description:'Fundamentos da acção moral',                                       term:2, displayOrder:4 },
  { id:'mz11fil-5', subjectId:'mz11-fil', title:'Filosofia Africana e Moçambicana',      description:'Pensadores e correntes filosóficas africanas',                     term:3, displayOrder:5 },
  { id:'mz11fil-6', subjectId:'mz11-fil', title:'Filosofia Política — Liberdade e Justiça', description:'Conceitos de liberdade, justiça e poder',                       term:3, displayOrder:6 },

  // ─── TIC 11ª Classe ──────────────────────────────────────────
  { id:'mz11tic-1', subjectId:'mz11-tic', title:'Tecnologia Aplicada à Área de Especialidade', description:'Ferramentas digitais específicas da área escolhida',            term:1, displayOrder:1 },
  { id:'mz11tic-2', subjectId:'mz11-tic', title:'Ferramentas de Produtividade Avançadas', description:'Automatização de tarefas com folhas de cálculo',                   term:1, displayOrder:2 },
  { id:'mz11tic-3', subjectId:'mz11-tic', title:'Pesquisa Científica com Recurso às TIC', description:'Bases de dados académicas e citação de fontes',                    term:2, displayOrder:3 },
  { id:'mz11tic-4', subjectId:'mz11-tic', title:'Multimédia e Comunicação Digital',      description:'Produção de conteúdo multimédia',                                   term:2, displayOrder:4 },
  { id:'mz11tic-5', subjectId:'mz11-tic', title:'Introdução a Bases de Dados',           description:'Modelação simples de dados',                                       term:3, displayOrder:5 },
  { id:'mz11tic-6', subjectId:'mz11-tic', title:'Ética e Segurança Digital',             description:'Uso responsável da tecnologia',                                    term:3, displayOrder:6 },

  // ─── Noções de Empreendedorismo 11ª Classe ──────────────────
  { id:'mz11emp-1', subjectId:'mz11-emp', title:'Identificação de Oportunidades de Negócio', description:'Análise aprofundada de oportunidades locais',                    term:1, displayOrder:1 },
  { id:'mz11emp-2', subjectId:'mz11-emp', title:'Gestão da Produção',                    description:'Organização de processos produtivos',                              term:1, displayOrder:2 },
  { id:'mz11emp-3', subjectId:'mz11-emp', title:'Gestão da Qualidade',                   description:'Controlo e melhoria da qualidade',                                  term:2, displayOrder:3 },
  { id:'mz11emp-4', subjectId:'mz11-emp', title:'Gestão de Recursos Humanos',            description:'Organização e liderança de equipas',                               term:2, displayOrder:4 },
  { id:'mz11emp-5', subjectId:'mz11-emp', title:'Gestão Financeira',                     description:'Controlo financeiro de uma actividade',                            term:3, displayOrder:5 },
  { id:'mz11emp-6', subjectId:'mz11-emp', title:'Oportunidades de Emprego e Auto-Emprego', description:'Transição da escola para o mercado de trabalho',                  term:3, displayOrder:6 },

  // ─── Introdução à Psicologia e Pedagogia 11ª Classe ─────────
  { id:'mz11psi-1', subjectId:'mz11-psi', title:'Introdução à Psicologia',               description:'Conceitos básicos e ramos da psicologia',                          term:1, displayOrder:1 },
  { id:'mz11psi-2', subjectId:'mz11-psi', title:'O Processo de Ensino-Aprendizagem',      description:'Como o aluno aprende',                                             term:1, displayOrder:2 },
  { id:'mz11psi-3', subjectId:'mz11-psi', title:'Desenvolvimento Humano e Aprendizagem',  description:'Etapas do desenvolvimento cognitivo',                              term:2, displayOrder:3 },
  { id:'mz11psi-4', subjectId:'mz11-psi', title:'Conceitos Básicos de Didáctica',         description:'Métodos e estratégias de ensino',                                  term:2, displayOrder:4 },
  { id:'mz11psi-5', subjectId:'mz11-psi', title:'Motivação e Comportamento em Sala de Aula', description:'Factores que influenciam a aprendizagem',                       term:3, displayOrder:5 },
  { id:'mz11psi-6', subjectId:'mz11-psi', title:'A Profissão Docente',                    description:'Papel e responsabilidades do professor',                          term:3, displayOrder:6 },

  // ─── Línguas Moçambicanas 11ª Classe ─────────────────────────
  { id:'mz11lm-1', subjectId:'mz11-lm', title:'Fonética e Fonologia da Língua Moçambicana', description:'Sistema de sons da língua escolhida',                              term:1, displayOrder:1 },
  { id:'mz11lm-2', subjectId:'mz11-lm', title:'Morfologia — Classes de Palavras',        description:'Estrutura das palavras na língua moçambicana',                     term:1, displayOrder:2 },
  { id:'mz11lm-3', subjectId:'mz11-lm', title:'Leitura e Escrita na Língua Moçambicana', description:'Ortografia padronizada e prática de leitura',                     term:2, displayOrder:3 },
  { id:'mz11lm-4', subjectId:'mz11-lm', title:'Literatura Oral — Provérbios e Contos',   description:'Tradição oral e valores culturais',                                term:2, displayOrder:4 },
  { id:'mz11lm-5', subjectId:'mz11-lm', title:'Produção de Textos na Língua Moçambicana', description:'Redacção de textos simples',                                       term:3, displayOrder:5 },
  { id:'mz11lm-6', subjectId:'mz11-lm', title:'Cultura e Identidade Linguística',        description:'Relação entre língua e identidade cultural',                       term:3, displayOrder:6 },

  // ─── Francês 11ª Classe ──────────────────────────────────────
  { id:'mz11fr-1', subjectId:'mz11-fr', title:'Salutations et Présentations',           description:'Cumprimentos e apresentação pessoal em francês',                   term:1, displayOrder:1 },
  { id:'mz11fr-2', subjectId:'mz11-fr', title:"Le Présent de l'Indicatif",              description:'Formação e uso do presente do indicativo',                         term:1, displayOrder:2 },
  { id:'mz11fr-3', subjectId:'mz11-fr', title:'Vocabulaire Quotidien',                  description:'Vocabulário do dia-a-dia',                                          term:2, displayOrder:3 },
  { id:'mz11fr-4', subjectId:'mz11-fr', title:'Description de Personnes et de Lieux',   description:'Adjectivos descritivos em francês',                                term:2, displayOrder:4 },
  { id:'mz11fr-5', subjectId:'mz11-fr', title:'Le Passé Composé',                       description:'Formação e uso do passado composto',                               term:3, displayOrder:5 },
  { id:'mz11fr-6', subjectId:'mz11-fr', title:'Compréhension de Textes Simples',        description:'Leitura e interpretação de textos curtos',                         term:3, displayOrder:6 },

  // ─── Desenho e Geometria Descritiva 11ª Classe ──────────────
  { id:'mz11dgd-1', subjectId:'mz11-dgd', title:'Sistemas de Projecção',                description:'Fundamentos da representação gráfica',                             term:1, displayOrder:1 },
  { id:'mz11dgd-2', subjectId:'mz11-dgd', title:'Representação Diédrica — Ponto, Recta e Plano', description:'Métodos de representação diédrica',                          term:1, displayOrder:2 },
  { id:'mz11dgd-3', subjectId:'mz11-dgd', title:'Verdadeira Grandeza',                  description:'Determinação de medidas reais em projecção',                       term:2, displayOrder:3 },
  { id:'mz11dgd-4', subjectId:'mz11-dgd', title:'Axonometria',                          description:'Representação axonométrica de sólidos',                            term:2, displayOrder:4 },
  { id:'mz11dgd-5', subjectId:'mz11-dgd', title:'Secções e Intersecções de Sólidos',    description:'Cortes e intersecções geométricas',                                term:3, displayOrder:5 },
  { id:'mz11dgd-6', subjectId:'mz11-dgd', title:'Aplicação a Problemas Estéticos e Utilitários', description:'Uso prático das construções geométricas',                    term:3, displayOrder:6 },

  // ─── Educação Visual 11ª Classe ─────────────────────────────
  { id:'mz11ev-1', subjectId:'mz11-ev', title:'Expressão Plástica e Materiais Multimédia', description:'Exploração de suportes convencionais e digitais',                 term:1, displayOrder:1 },
  { id:'mz11ev-2', subjectId:'mz11-ev', title:'Fotografia e Imagem Digital',            description:'Composição fotográfica e edição básica',                           term:1, displayOrder:2 },
  { id:'mz11ev-3', subjectId:'mz11-ev', title:'Design e Comunicação Visual',            description:'Princípios de identidade visual',                                  term:2, displayOrder:3 },
  { id:'mz11ev-4', subjectId:'mz11-ev', title:'Arte Contemporânea Moçambicana',         description:'Artistas e movimentos actuais',                                    term:2, displayOrder:4 },
  { id:'mz11ev-5', subjectId:'mz11-ev', title:'Escultura e Instalação',                 description:'Trabalhos tridimensionais e espaciais',                            term:3, displayOrder:5 },
  { id:'mz11ev-6', subjectId:'mz11-ev', title:'Projecto Artístico Individual',          description:'Concepção e apresentação de um trabalho próprio',                  term:3, displayOrder:6 },

  // ─── Artes Cénicas 11ª Classe ────────────────────────────────
  { id:'mz11ac-1', subjectId:'mz11-ac', title:'Introdução ao Teatro',                   description:'Elementos e linguagem teatral',                                    term:1, displayOrder:1 },
  { id:'mz11ac-2', subjectId:'mz11-ac', title:'Expressão Corporal e Voz',               description:'Técnicas de corpo e voz para a cena',                              term:1, displayOrder:2 },
  { id:'mz11ac-3', subjectId:'mz11-ac', title:'Teoria Musical Aplicada',                description:'Elementos musicais aplicados à performance',                       term:2, displayOrder:3 },
  { id:'mz11ac-4', subjectId:'mz11-ac', title:'Dança Tradicional e Contemporânea',      description:'Movimentos e géneros de dança',                                    term:2, displayOrder:4 },
  { id:'mz11ac-5', subjectId:'mz11-ac', title:'Encenação e Interpretação',              description:'Construção de uma personagem',                                     term:3, displayOrder:5 },
  { id:'mz11ac-6', subjectId:'mz11-ac', title:'Produção de um Espectáculo',             description:'Planificação e apresentação final',                                term:3, displayOrder:6 },

  // ══════════════════════════════════════════════════════════
  //  MOÇAMBIQUE 12ª Classe
  // ══════════════════════════════════════════════════════════
  { id:'mz12mat-1-1', subjectId:'mz12-mat', title:'Cálculo Integral Avançado',            description:'Integrais duplos, por partes e por fracções parciais',            term:1, displayOrder:1 },
  { id:'mz12mat-2-1', subjectId:'mz12-mat', title:'Números Complexos',                    description:'Forma algébrica, trigonométrica e exponencial',                   term:2, displayOrder:2 },
  { id:'mz12mat-3-1', subjectId:'mz12-mat', title:'Revisão para Exame Nacional',          description:'Todos os temas do ESG2 com exercícios de exames anteriores',      term:3, displayOrder:3 },

  { id:'mz12fis-1-1', subjectId:'mz12-fis', title:'Física Atómica e Espectros',           description:'Espectros de emissão e absorção, lasers',                         term:1, displayOrder:1 },
  { id:'mz12fis-2-1', subjectId:'mz12-fis', title:'Energia Nuclear e Reactores',          description:'Aplicações da energia nuclear e segurança',                       term:2, displayOrder:2 },
  { id:'mz12fis-3-1', subjectId:'mz12-fis', title:'Revisão para Exame Nacional',          description:'Exercícios de exames anteriores e simulações',                    term:3, displayOrder:3 },

  // ─── Geografia 12ª Classe ────────────────────────────────────
  { id:'mz12geo-1', subjectId:'mz12-geo', title:'Geografia Física de Moçambique — Aprofundamento', description:'Análise integrada do relevo e clima',                      term:1, displayOrder:1 },
  { id:'mz12geo-2', subjectId:'mz12-geo', title:'Recursos Naturais e Desenvolvimento',    description:'Exploração de recursos e desenvolvimento sustentável',            term:1, displayOrder:2 },
  { id:'mz12geo-3', subjectId:'mz12-geo', title:'Geografia Económica Mundial',            description:'Blocos económicos e comércio internacional',                      term:2, displayOrder:3 },
  { id:'mz12geo-4', subjectId:'mz12-geo', title:'Globalização e Relações Económicas',     description:'Interdependência económica entre países',                          term:2, displayOrder:4 },
  { id:'mz12geo-5', subjectId:'mz12-geo', title:'Ambiente e Alterações Climáticas Globais', description:'Impactos e respostas às alterações climáticas',                   term:3, displayOrder:5 },
  { id:'mz12geo-6', subjectId:'mz12-geo', title:'Revisão para Exame Nacional',            description:'Consolidação dos temas do ESG2',                                   term:3, displayOrder:6 },

  // ─── História 12ª Classe ─────────────────────────────────────
  { id:'mz12his-1', subjectId:'mz12-his', title:'Moçambique Independente — Primeiros Anos', description:'Construção do Estado após 1975',                                 term:1, displayOrder:1 },
  { id:'mz12his-2', subjectId:'mz12-his', title:'Guerra Civil e Acordo de Paz',           description:'Conflito armado e Acordo Geral de Paz de 1992',                    term:1, displayOrder:2 },
  { id:'mz12his-3', subjectId:'mz12-his', title:'Democracia Multipartidária em Moçambique', description:'Transição política e eleições',                                  term:2, displayOrder:3 },
  { id:'mz12his-4', subjectId:'mz12-his', title:'Moçambique na SADC e na União Africana', description:'Cooperação regional e continental',                                term:2, displayOrder:4 },
  { id:'mz12his-5', subjectId:'mz12-his', title:'Grandes Conflitos do Século XX',         description:'Guerras mundiais e Guerra Fria',                                   term:3, displayOrder:5 },
  { id:'mz12his-6', subjectId:'mz12-his', title:'Revisão para Exame Nacional',            description:'Consolidação dos temas do ESG2',                                   term:3, displayOrder:6 },

  // ─── Inglês 12ª Classe ───────────────────────────────────────
  { id:'mz12ing-1', subjectId:'mz12-ing', title:'Advanced Reading Comprehension',         description:'Textos académicos e jornalísticos complexos',                     term:1, displayOrder:1 },
  { id:'mz12ing-2', subjectId:'mz12-ing', title:'Academic Writing Skills',                description:'Estrutura de ensaios e trabalhos académicos',                      term:1, displayOrder:2 },
  { id:'mz12ing-3', subjectId:'mz12-ing', title:'Debate and Argumentation in English',    description:'Técnicas de argumentação e debate',                                term:2, displayOrder:3 },
  { id:'mz12ing-4', subjectId:'mz12-ing', title:'English for Specific Purposes',          description:'Vocabulário técnico da área de especialidade',                    term:2, displayOrder:4 },
  { id:'mz12ing-5', subjectId:'mz12-ing', title:'Listening and Note-Taking',              description:'Compreensão oral e registo de notas',                              term:3, displayOrder:5 },
  { id:'mz12ing-6', subjectId:'mz12-ing', title:'Exam Preparation and Practice',          description:'Simulações para o exame nacional',                                 term:3, displayOrder:6 },

  // ─── Introdução à Filosofia 12ª Classe ──────────────────────
  { id:'mz12fil-1', subjectId:'mz12-fil', title:'Filosofia da Ciência',                  description:'Método científico e limites do conhecimento',                     term:1, displayOrder:1 },
  { id:'mz12fil-2', subjectId:'mz12-fil', title:'Filosofia Social e Política',           description:'Poder, Estado e sociedade',                                        term:1, displayOrder:2 },
  { id:'mz12fil-3', subjectId:'mz12-fil', title:'Existencialismo e Liberdade',           description:'Liberdade, responsabilidade e existência',                         term:2, displayOrder:3 },
  { id:'mz12fil-4', subjectId:'mz12-fil', title:'Filosofia e Cidadania',                 description:'Reflexão filosófica sobre direitos e deveres',                     term:2, displayOrder:4 },
  { id:'mz12fil-5', subjectId:'mz12-fil', title:'Grandes Correntes do Pensamento Contemporâneo', description:'Panorama das principais correntes filosóficas',                term:3, displayOrder:5 },
  { id:'mz12fil-6', subjectId:'mz12-fil', title:'Revisão para Exame Nacional',           description:'Consolidação dos temas do ESG2',                                   term:3, displayOrder:6 },

  // ─── TIC 12ª Classe ──────────────────────────────────────────
  { id:'mz12tic-1', subjectId:'mz12-tic', title:'Sistemas de Informação Aplicados',      description:'Aplicação de sistemas de informação à área de especialidade',      term:1, displayOrder:1 },
  { id:'mz12tic-2', subjectId:'mz12-tic', title:'Gestão de Projectos Digitais',          description:'Planeamento e execução de projectos com recurso às TIC',          term:1, displayOrder:2 },
  { id:'mz12tic-3', subjectId:'mz12-tic', title:'Segurança e Protecção de Dados',        description:'Boas práticas de segurança da informação',                        term:2, displayOrder:3 },
  { id:'mz12tic-4', subjectId:'mz12-tic', title:'Introdução à Programação Aplicada',     description:'Resolução de problemas com lógica de programação',                 term:2, displayOrder:4 },
  { id:'mz12tic-5', subjectId:'mz12-tic', title:'Tecnologia e Inovação',                 description:'Tendências tecnológicas e impacto social',                         term:3, displayOrder:5 },
  { id:'mz12tic-6', subjectId:'mz12-tic', title:'Revisão para Exame Nacional',           description:'Consolidação dos temas do ESG2',                                   term:3, displayOrder:6 },

  // ─── Noções de Empreendedorismo 12ª Classe ──────────────────
  { id:'mz12emp-1', subjectId:'mz12-emp', title:'Plano de Negócio Avançado',             description:'Elaboração completa de um plano de negócio',                      term:1, displayOrder:1 },
  { id:'mz12emp-2', subjectId:'mz12-emp', title:'Gestão Financeira e Investimento',      description:'Análise de investimento e viabilidade financeira',                term:1, displayOrder:2 },
  { id:'mz12emp-3', subjectId:'mz12-emp', title:'Marketing Estratégico',                 description:'Estratégias de posicionamento e marca',                            term:2, displayOrder:3 },
  { id:'mz12emp-4', subjectId:'mz12-emp', title:'Legislação Comercial e Fiscal',         description:'Enquadramento legal da actividade empresarial',                    term:2, displayOrder:4 },
  { id:'mz12emp-5', subjectId:'mz12-emp', title:'Ética e Responsabilidade Social Empresarial', description:'Impacto social e ambiental do negócio',                        term:3, displayOrder:5 },
  { id:'mz12emp-6', subjectId:'mz12-emp', title:'Projecto Final de Empreendedorismo',    description:'Apresentação de um projecto de negócio completo',                 term:3, displayOrder:6 },

  // ─── Introdução à Psicologia e Pedagogia 12ª Classe ─────────
  { id:'mz12psi-1', subjectId:'mz12-psi', title:'Psicologia do Desenvolvimento do Adolescente', description:'Características da fase da adolescência',                    term:1, displayOrder:1 },
  { id:'mz12psi-2', subjectId:'mz12-psi', title:'Teorias de Aprendizagem',               description:'Principais teorias pedagógicas',                                   term:1, displayOrder:2 },
  { id:'mz12psi-3', subjectId:'mz12-psi', title:'Avaliação Educacional',                 description:'Métodos e finalidades da avaliação',                              term:2, displayOrder:3 },
  { id:'mz12psi-4', subjectId:'mz12-psi', title:'Gestão da Sala de Aula',                description:'Estratégias de organização da turma',                              term:2, displayOrder:4 },
  { id:'mz12psi-5', subjectId:'mz12-psi', title:'Inclusão e Necessidades Educativas Especiais', description:'Estratégias para uma educação inclusiva',                       term:3, displayOrder:5 },
  { id:'mz12psi-6', subjectId:'mz12-psi', title:'Preparação para a Formação de Professores', description:'Requisitos e percursos de formação docente',                    term:3, displayOrder:6 },

  // ─── Línguas Moçambicanas 12ª Classe ─────────────────────────
  { id:'mz12lm-1', subjectId:'mz12-lm', title:'Sintaxe da Língua Moçambicana',           description:'Estrutura de frases na língua escolhida',                          term:1, displayOrder:1 },
  { id:'mz12lm-2', subjectId:'mz12-lm', title:'Literatura Escrita em Língua Moçambicana', description:'Autores e obras em línguas moçambicanas',                          term:1, displayOrder:2 },
  { id:'mz12lm-3', subjectId:'mz12-lm', title:'Tradução e Interpretação Básica',         description:'Noções de tradução entre línguas moçambicanas e português',        term:2, displayOrder:3 },
  { id:'mz12lm-4', subjectId:'mz12-lm', title:'Produção de Textos Avançados',            description:'Redacção de textos complexos',                                     term:2, displayOrder:4 },
  { id:'mz12lm-5', subjectId:'mz12-lm', title:'Línguas Moçambicanas e Identidade Nacional', description:'Papel das línguas na identidade do país',                       term:3, displayOrder:5 },
  { id:'mz12lm-6', subjectId:'mz12-lm', title:'Revisão para Exame Nacional',             description:'Consolidação dos temas do ESG2',                                   term:3, displayOrder:6 },

  // ─── Francês 12ª Classe ──────────────────────────────────────
  { id:'mz12fr-1', subjectId:'mz12-fr', title:'Le Futur Simple',                        description:'Formação e uso do futuro simples',                                 term:1, displayOrder:1 },
  { id:'mz12fr-2', subjectId:'mz12-fr', title:"Expression de l'Opinion",                description:'Estruturas para expressar opinião',                                term:1, displayOrder:2 },
  { id:'mz12fr-3', subjectId:'mz12-fr', title:'Culture et Francophonie',                description:'Países e culturas de língua francesa',                             term:2, displayOrder:3 },
  { id:'mz12fr-4', subjectId:'mz12-fr', title:'Compréhension Orale Avancée',            description:'Compreensão de diálogos e áudios complexos',                       term:2, displayOrder:4 },
  { id:'mz12fr-5', subjectId:'mz12-fr', title:'Rédaction de Textes',                    description:'Produção de textos estruturados em francês',                       term:3, displayOrder:5 },
  { id:'mz12fr-6', subjectId:'mz12-fr', title:"Révision pour l'Examen National",        description:'Consolidação dos temas do ESG2',                                    term:3, displayOrder:6 },

  // ─── Desenho e Geometria Descritiva 12ª Classe ──────────────
  { id:'mz12dgd-1', subjectId:'mz12-dgd', title:'Superfícies e Sólidos Complexos',       description:'Representação de sólidos de revolução',                            term:1, displayOrder:1 },
  { id:'mz12dgd-2', subjectId:'mz12-dgd', title:'Perspectiva Aplicada a Projectos',      description:'Uso da perspectiva em projectos técnicos',                         term:1, displayOrder:2 },
  { id:'mz12dgd-3', subjectId:'mz12-dgd', title:'Desenho Assistido — Noções Digitais',   description:'Introdução a ferramentas digitais de desenho técnico',             term:2, displayOrder:3 },
  { id:'mz12dgd-4', subjectId:'mz12-dgd', title:'Aplicações à Arquitectura e Design',    description:'Uso da geometria descritiva em projectos reais',                   term:2, displayOrder:4 },
  { id:'mz12dgd-5', subjectId:'mz12-dgd', title:'Projecto Técnico Final',               description:'Concepção e apresentação de um projecto completo',                 term:3, displayOrder:5 },
  { id:'mz12dgd-6', subjectId:'mz12-dgd', title:'Revisão para Exame Nacional',          description:'Consolidação dos temas do ESG2',                                    term:3, displayOrder:6 },

  // ─── Educação Visual 12ª Classe ─────────────────────────────
  { id:'mz12ev-1', subjectId:'mz12-ev', title:'Projecto Artístico Avançado',            description:'Desenvolvimento de um projecto artístico pessoal',                 term:1, displayOrder:1 },
  { id:'mz12ev-2', subjectId:'mz12-ev', title:'Curadoria e Exposição de Trabalhos',     description:'Organização e apresentação de uma exposição',                      term:1, displayOrder:2 },
  { id:'mz12ev-3', subjectId:'mz12-ev', title:'Arte e Sociedade Moçambicana',           description:'Relação entre produção artística e contexto social',               term:2, displayOrder:3 },
  { id:'mz12ev-4', subjectId:'mz12-ev', title:'Novos Media e Arte Digital',             description:'Exploração de ferramentas digitais na arte',                       term:2, displayOrder:4 },
  { id:'mz12ev-5', subjectId:'mz12-ev', title:'Portfólio Artístico Final',              description:'Organização do portfólio de trabalhos do ciclo',                   term:3, displayOrder:5 },
  { id:'mz12ev-6', subjectId:'mz12-ev', title:'Revisão para Exame Nacional',            description:'Consolidação dos temas do ESG2',                                    term:3, displayOrder:6 },

  // ─── Artes Cénicas 12ª Classe ────────────────────────────────
  { id:'mz12ac-1', subjectId:'mz12-ac', title:'Dramaturgia e Escrita Cénica',           description:'Criação de textos para teatro',                                    term:1, displayOrder:1 },
  { id:'mz12ac-2', subjectId:'mz12-ac', title:'Direcção e Produção Teatral',           description:'Organização de uma produção teatral',                              term:1, displayOrder:2 },
  { id:'mz12ac-3', subjectId:'mz12-ac', title:'Música Cénica e Sonoplastia',           description:'Uso da música e do som na cena',                                    term:2, displayOrder:3 },
  { id:'mz12ac-4', subjectId:'mz12-ac', title:'Dança Contemporânea Moçambicana',       description:'Criações coreográficas contemporâneas',                             term:2, displayOrder:4 },
  { id:'mz12ac-5', subjectId:'mz12-ac', title:'Produção de um Espectáculo Final',      description:'Planificação e apresentação de um espectáculo completo',           term:3, displayOrder:5 },
  { id:'mz12ac-6', subjectId:'mz12-ac', title:'Revisão para Exame Nacional',           description:'Consolidação dos temas do ESG2',                                    term:3, displayOrder:6 },

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
  //  ANGOLA — 7ª Classe (ES1) — Currículo expandido
  // ══════════════════════════════════════════════════════════

  // ─── Matemática 7ª Classe ─────────────────────────────────
  { id:'ao7mat-1-1', subjectId:'ao7-mat',  title:'Números Inteiros e Operações',      description:'Adição, subtração, multiplicação e divisão de inteiros',   term:1, displayOrder:1 },
  { id:'ao7mat-1-2', subjectId:'ao7-mat',  title:'Fracções e Números Decimais',        description:'Simplificação, operações e conversões',                   term:1, displayOrder:2 },
  { id:'ao7mat-1-3', subjectId:'ao7-mat',  title:'Divisibilidade e Números Primos',    description:'MMC, MDC e critérios de divisibilidade',                  term:1, displayOrder:3 },
  { id:'ao7mat-2-1', subjectId:'ao7-mat',  title:'Equações do 1º Grau',               description:'Resolução de equações simples e problemas',               term:2, displayOrder:4 },
  { id:'ao7mat-2-2', subjectId:'ao7-mat',  title:'Proporcionalidade',                 description:'Razão, proporção, regra de três simples e composta',      term:2, displayOrder:5 },
  { id:'ao7mat-2-3', subjectId:'ao7-mat',  title:'Percentagem e Juros Simples',       description:'Cálculo de percentagens e problemas financeiros básicos',  term:2, displayOrder:6 },
  { id:'ao7mat-3-1', subjectId:'ao7-mat',  title:'Geometria Plana — Polígonos',       description:'Triângulos, quadriláteros e suas propriedades',           term:3, displayOrder:7 },
  { id:'ao7mat-3-2', subjectId:'ao7-mat',  title:'Perímetro e Área',                  description:'Cálculo de áreas de figuras planas — triângulo, retângulo, círculo', term:3, displayOrder:8 },
  { id:'ao7mat-3-3', subjectId:'ao7-mat',  title:'Introdução à Estatística',          description:'Tabelas de frequência e gráficos de barras e setores',    term:3, displayOrder:9 },

  // ─── Língua Portuguesa 7ª Classe ─────────────────────────
  { id:'ao7por-1-1', subjectId:'ao7-port', title:'Comunicação Oral e Escrita',        description:'Tipos de texto e intenção comunicativa',                  term:1, displayOrder:1 },
  { id:'ao7por-1-2', subjectId:'ao7-port', title:'Classes de Palavras I',             description:'Substantivo, adjectivo, verbo e advérbio',               term:1, displayOrder:2 },
  { id:'ao7por-1-3', subjectId:'ao7-port', title:'Leitura e Compreensão',             description:'Interpretação de textos narrativos e descritivos',        term:1, displayOrder:3 },
  { id:'ao7por-2-1', subjectId:'ao7-port', title:'Classes de Palavras II',            description:'Pronomes, preposições, conjunções e interjeições',        term:2, displayOrder:4 },
  { id:'ao7por-2-2', subjectId:'ao7-port', title:'Sintaxe Básica',                    description:'Sujeito, predicado e complementos',                       term:2, displayOrder:5 },
  { id:'ao7por-2-3', subjectId:'ao7-port', title:'Texto Narrativo — Conto Angolano',  description:'Análise de contos da tradição oral angolana',             term:2, displayOrder:6 },
  { id:'ao7por-3-1', subjectId:'ao7-port', title:'Produção Escrita — Narração',       description:'Narração com personagens, espaço e tempo',                term:3, displayOrder:7 },
  { id:'ao7por-3-2', subjectId:'ao7-port', title:'Produção Escrita — Descrição',      description:'Descrição de pessoas, lugares e objectos',                term:3, displayOrder:8 },
  { id:'ao7por-3-3', subjectId:'ao7-port', title:'Ortografia e Pontuação',            description:'Regras ortográficas e uso correcto da pontuação',         term:3, displayOrder:9 },

  // ─── Ciências Físicas 7ª Classe ──────────────────────────
  { id:'ao7cf-1-1',  subjectId:'ao7-fis',  title:'Matéria e suas Propriedades',       description:'Estados físicos, densidade e mudanças de estado',         term:1, displayOrder:1 },
  { id:'ao7cf-1-2',  subjectId:'ao7-fis',  title:'Energia e suas Transformações',     description:'Formas de energia: mecânica, térmica, eléctrica, luminosa', term:1, displayOrder:2 },
  { id:'ao7cf-2-1',  subjectId:'ao7-fis',  title:'Substâncias e Misturas',            description:'Elementos, compostos, misturas e métodos de separação',   term:2, displayOrder:3 },
  { id:'ao7cf-2-2',  subjectId:'ao7-fis',  title:'Introdução à Química',              description:'Átomo, molécula e símbolo dos elementos mais comuns',     term:2, displayOrder:4 },
  { id:'ao7cf-3-1',  subjectId:'ao7-fis',  title:'Força e Movimento',                 description:'Tipos de força, velocidade e atrito',                     term:3, displayOrder:5 },
  { id:'ao7cf-3-2',  subjectId:'ao7-fis',  title:'Energia Solar e Sustentabilidade',  description:'Fontes de energia renováveis e não renováveis em Angola',  term:3, displayOrder:6 },

  // ─── Ciências Naturais 7ª Classe ─────────────────────────
  { id:'ao7nat-1-1', subjectId:'ao7-nat',  title:'Seres Vivos e Classificação',       description:'Reinos, características e critérios de classificação',    term:1, displayOrder:1 },
  { id:'ao7nat-1-2', subjectId:'ao7-nat',  title:'Célula — Unidade da Vida',          description:'Célula animal e vegetal, organelos e funções',            term:1, displayOrder:2 },
  { id:'ao7nat-2-1', subjectId:'ao7-nat',  title:'Ecossistemas Angolanos',            description:'Savana, floresta do Maiombe, manguezal e deserto do Namibe', term:2, displayOrder:3 },
  { id:'ao7nat-2-2', subjectId:'ao7-nat',  title:'Cadeias e Teias Alimentares',       description:'Produtores, consumidores, decompositores e fluxo de energia', term:2, displayOrder:4 },
  { id:'ao7nat-3-1', subjectId:'ao7-nat',  title:'Saúde e Higiene em Angola',         description:'Doenças transmissíveis: malária, cólera, febre-amarela',  term:3, displayOrder:5 },
  { id:'ao7nat-3-2', subjectId:'ao7-nat',  title:'HIV/SIDA — Prevenção',              description:'Transmissão, prevenção e vida saudável',                  term:3, displayOrder:6 },

  // ─── História 7ª Classe ───────────────────────────────────
  { id:'ao7his-1-1', subjectId:'ao7-his',  title:'Pré-História e Evolução Humana',    description:'Hominídeos, paleolítico, neolítico e revolução agrícola', term:1, displayOrder:1 },
  { id:'ao7his-1-2', subjectId:'ao7-his',  title:'Primeiros Humanos em Angola',       description:'Povos San e Banto — primeiros habitantes do território',  term:1, displayOrder:2 },
  { id:'ao7his-2-1', subjectId:'ao7-his',  title:'Civilizações do Nilo — Egipto',     description:'Faraós, pirâmides, escrita hieroglífica e sociedade',     term:2, displayOrder:3 },
  { id:'ao7his-2-2', subjectId:'ao7-his',  title:'Grécia e Roma Antigas',             description:'Democracia grega e República/Império romano',             term:2, displayOrder:4 },
  { id:'ao7his-3-1', subjectId:'ao7-his',  title:'Reinos Africanos — Congo e Ndongo', description:'Organização política, social e económica dos reinos',     term:3, displayOrder:5 },
  { id:'ao7his-3-2', subjectId:'ao7-his',  title:'Chegada dos Portugueses a Angola',  description:'Primeiros contactos europeus, século XV e XVI',           term:3, displayOrder:6 },

  // ─── Geografia 7ª Classe ─────────────────────────────────
  { id:'ao7geo-1-1', subjectId:'ao7-geo',  title:'Introdução à Geografia',            description:'O que é Geografia, ramos e importância',                 term:1, displayOrder:1 },
  { id:'ao7geo-1-2', subjectId:'ao7-geo',  title:'Cartografia Básica',                description:'Mapas, escalas, legendas e coordenadas geográficas',     term:1, displayOrder:2 },
  { id:'ao7geo-2-1', subjectId:'ao7-geo',  title:'Relevo e Solo de Angola',           description:'Planaltos, planícies e serras de Angola',                 term:2, displayOrder:3 },
  { id:'ao7geo-2-2', subjectId:'ao7-geo',  title:'Clima e Vegetação de Angola',       description:'Tipos de clima, savana, floresta e deserto',              term:2, displayOrder:4 },
  { id:'ao7geo-3-1', subjectId:'ao7-geo',  title:'Rios e Recursos Hídricos de Angola',description:'Rio Cubango, Cunene, Congo e aproveitamento hídrico',    term:3, displayOrder:5 },
  { id:'ao7geo-3-2', subjectId:'ao7-geo',  title:'População e Províncias de Angola',  description:'18 províncias, grupos étnicos e distribuição populacional', term:3, displayOrder:6 },

  // ─── Língua Inglesa 7ª Classe ────────────────────────────
  { id:'ao7ing-1-1', subjectId:'ao7-ing',  title:'Hello! — Greetings & Introductions',description:'Self-introductions, alphabet and classroom language',     term:1, displayOrder:1 },
  { id:'ao7ing-1-2', subjectId:'ao7-ing',  title:'My Family and My Home',             description:'Family members, numbers 1-100 and describing home',      term:1, displayOrder:2 },
  { id:'ao7ing-2-1', subjectId:'ao7-ing',  title:'Present Simple — Daily Routines',   description:'Verbs, time expressions and daily activities',            term:2, displayOrder:3 },
  { id:'ao7ing-2-2', subjectId:'ao7-ing',  title:'Food, Shopping and Prices',         description:'Vocabulary for food, market interactions and numbers',   term:2, displayOrder:4 },
  { id:'ao7ing-3-1', subjectId:'ao7-ing',  title:'Past Simple — My Weekend',          description:'Regular and irregular verbs in past tense',              term:3, displayOrder:5 },
  { id:'ao7ing-3-2', subjectId:'ao7-ing',  title:'Angola and the World',              description:'Countries, capitals, flags and basic geography',         term:3, displayOrder:6 },

  // ══════════════════════════════════════════════════════════
  //  ANGOLA — 8ª Classe (ES1) — Currículo expandido
  // ══════════════════════════════════════════════════════════

  // ─── Matemática 8ª Classe ─────────────────────────────────
  { id:'ao8mat-1-1', subjectId:'ao8-mat',  title:'Números Reais e Radicais',          description:'Raiz quadrada, cúbica e operações com radicais',          term:1, displayOrder:1 },
  { id:'ao8mat-1-2', subjectId:'ao8-mat',  title:'Álgebra — Expressões Algébricas',   description:'Monómios, polinómios, soma e produto',                    term:1, displayOrder:2 },
  { id:'ao8mat-1-3', subjectId:'ao8-mat',  title:'Factorização Algébrica',            description:'Factor comum, diferença de quadrados e trinómio perfeito', term:1, displayOrder:3 },
  { id:'ao8mat-2-1', subjectId:'ao8-mat',  title:'Equações do 2º Grau',               description:'Fórmula resolvente, discriminante e tipos de solução',    term:2, displayOrder:4 },
  { id:'ao8mat-2-2', subjectId:'ao8-mat',  title:'Sistemas de Equações do 1º Grau',   description:'Métodos de substituição, eliminação e igualação',         term:2, displayOrder:5 },
  { id:'ao8mat-2-3', subjectId:'ao8-mat',  title:'Geometria — Teorema de Pitágoras',  description:'Triângulo rectângulo, hipotenusa e aplicações práticas',  term:2, displayOrder:6 },
  { id:'ao8mat-3-1', subjectId:'ao8-mat',  title:'Geometria Espacial — Noções',       description:'Prismas, pirâmides, cilindros — volume e área lateral',  term:3, displayOrder:7 },
  { id:'ao8mat-3-2', subjectId:'ao8-mat',  title:'Estatística — Medidas de Tendência',description:'Média, moda, mediana e representação gráfica',            term:3, displayOrder:8 },
  { id:'ao8mat-3-3', subjectId:'ao8-mat',  title:'Probabilidade Básica',              description:'Espaço amostral, eventos e probabilidade clássica',       term:3, displayOrder:9 },

  // ─── Língua Portuguesa 8ª Classe ─────────────────────────
  { id:'ao8por-1-1', subjectId:'ao8-port', title:'Texto Jornalístico — Notícia',      description:'Estrutura da notícia, reportagem e artigo de opinião',   term:1, displayOrder:1 },
  { id:'ao8por-1-2', subjectId:'ao8-port', title:'Gramática — Morfologia Avançada',   description:'Processos de formação de palavras: derivação e composição', term:1, displayOrder:2 },
  { id:'ao8por-1-3', subjectId:'ao8-port', title:'Concordância Nominal e Verbal',     description:'Regras de concordância e casos especiais em Português',   term:1, displayOrder:3 },
  { id:'ao8por-2-1', subjectId:'ao8-port', title:'Literatura Africana de Língua Port',description:'Contos e poemas de autores de Angola, Moçambique e CV',   term:2, displayOrder:4 },
  { id:'ao8por-2-2', subjectId:'ao8-port', title:'Regência Nominal e Verbal',         description:'Preposições obrigatórias e crase',                        term:2, displayOrder:5 },
  { id:'ao8por-2-3', subjectId:'ao8-port', title:'Figuras de Linguagem',              description:'Metáfora, comparação, metonímia e hipérbole',             term:2, displayOrder:6 },
  { id:'ao8por-3-1', subjectId:'ao8-port', title:'Texto Argumentativo',               description:'Tese, argumentos, contra-argumentos e conclusão',         term:3, displayOrder:7 },
  { id:'ao8por-3-2', subjectId:'ao8-port', title:'Pontuação e Estilo',                description:'Uso do ponto e vírgula, travessão e parênteses',          term:3, displayOrder:8 },
  { id:'ao8por-3-3', subjectId:'ao8-port', title:'Revisão e Exame Escolar',           description:'Exercícios de consolidação e preparação para provas',      term:3, displayOrder:9 },

  // ─── Ciências Físicas 8ª Classe ──────────────────────────
  { id:'ao8cf-1-1',  subjectId:'ao8-fis',  title:'Calor e Temperatura',               description:'Escalas termométricas, dilatação e calorimetria',        term:1, displayOrder:1 },
  { id:'ao8cf-1-2',  subjectId:'ao8-fis',  title:'Mudanças de Estado — Gráficos',     description:'Fusão, evaporação, solidificação e condensação',          term:1, displayOrder:2 },
  { id:'ao8cf-2-1',  subjectId:'ao8-fis',  title:'Electricidade — Carga e Corrente',  description:'Condutores, isolantes, circuitos série e paralelo',       term:2, displayOrder:3 },
  { id:'ao8cf-2-2',  subjectId:'ao8-fis',  title:'Lei de Ohm e Circuitos Eléctricos', description:'Tensão, corrente, resistência e potência eléctrica',      term:2, displayOrder:4 },
  { id:'ao8cf-3-1',  subjectId:'ao8-fis',  title:'Reacções Químicas e Balanceamento', description:'Tipos de reacções e balanceamento de equações químicas',  term:3, displayOrder:5 },
  { id:'ao8cf-3-2',  subjectId:'ao8-fis',  title:'Ácidos, Bases e Sais',              description:'pH, indicadores e funções inorgânicas básicas',           term:3, displayOrder:6 },

  // ─── Ciências Naturais 8ª Classe ─────────────────────────
  { id:'ao8nat-1-1', subjectId:'ao8-nat',  title:'A Célula em Detalhe',               description:'Organelos celulares, membrana e núcleo',                  term:1, displayOrder:1 },
  { id:'ao8nat-1-2', subjectId:'ao8-nat',  title:'Divisão Celular',                   description:'Mitose, meiose — etapas e importância biológica',         term:1, displayOrder:2 },
  { id:'ao8nat-2-1', subjectId:'ao8-nat',  title:'Sistema Reprodutor Humano',         description:'Anatomia, fisiologia e puberdade',                        term:2, displayOrder:3 },
  { id:'ao8nat-2-2', subjectId:'ao8-nat',  title:'IST — Infecções Sexualmente Transm.',description:'Prevenção, tratamento e saúde sexual responsável',       term:2, displayOrder:4 },
  { id:'ao8nat-3-1', subjectId:'ao8-nat',  title:'Genética de Mendel',                description:'1ª e 2ª Lei — cruzamentos e probabilidade hereditária',   term:3, displayOrder:5 },
  { id:'ao8nat-3-2', subjectId:'ao8-nat',  title:'DNA e Hereditariedade',             description:'Estrutura do DNA, cromossomas e aplicações básicas',      term:3, displayOrder:6 },

  // ─── História 8ª Classe ───────────────────────────────────
  { id:'ao8his-1-1', subjectId:'ao8-his',  title:'Expansão Europeia e Grandes Naveg.',description:'Portugueses, espanhóis e chegada à África e América',     term:1, displayOrder:1 },
  { id:'ao8his-1-2', subjectId:'ao8-his',  title:'Contacto Europeu com o Congo e Angola',description:'Aliança entre Portugal e o Reino do Congo, século XV',  term:1, displayOrder:2 },
  { id:'ao8his-2-1', subjectId:'ao8-his',  title:'Tráfico Negreiro e Escravatura',    description:'Impacto em Angola — resistência, rotas e consequências',   term:2, displayOrder:3 },
  { id:'ao8his-2-2', subjectId:'ao8-his',  title:'Revolução Americana e Francesa',    description:'Iluminismo, independência e queda do Absolutismo',        term:2, displayOrder:4 },
  { id:'ao8his-3-1', subjectId:'ao8-his',  title:'Revolução Industrial',              description:'Máquina a vapor, classes sociais e capitalismo industrial', term:3, displayOrder:5 },
  { id:'ao8his-3-2', subjectId:'ao8-his',  title:'Imperialismo e Colonialismo em África',description:'Conferência de Berlim (1884-85) e partilha de África',  term:3, displayOrder:6 },

  // ─── Geografia 8ª Classe ─────────────────────────────────
  { id:'ao8geo-1-1', subjectId:'ao8-geo',  title:'Angola — Situação Geográfica',      description:'Localização, fronteiras, superfície e divisão administrativa', term:1, displayOrder:1 },
  { id:'ao8geo-1-2', subjectId:'ao8-geo',  title:'Hidrografia de Angola',             description:'Bacias hidrográficas, rios e lagos de Angola',             term:1, displayOrder:2 },
  { id:'ao8geo-2-1', subjectId:'ao8-geo',  title:'Clima e Biomas de Angola',          description:'Subtropical, tropical seco, deserto — fauna e flora',     term:2, displayOrder:3 },
  { id:'ao8geo-2-2', subjectId:'ao8-geo',  title:'População de Angola',               description:'Crescimento, urbanização, migrações e grupos étnicos',    term:2, displayOrder:4 },
  { id:'ao8geo-3-1', subjectId:'ao8-geo',  title:'Economia de Angola — Sector Primário',description:'Petróleo, diamantes, agricultura e pesca',              term:3, displayOrder:5 },
  { id:'ao8geo-3-2', subjectId:'ao8-geo',  title:'Economia de Angola — Turismo e Serv.',description:'Turismo, comércio e desenvolvimento económico',         term:3, displayOrder:6 },

  // ─── Língua Inglesa 8ª Classe ────────────────────────────
  { id:'ao8ing-1-1', subjectId:'ao8-ing',  title:'Revision: Present Simple & Continuous',description:'Differences, time markers and practice exercises',      term:1, displayOrder:1 },
  { id:'ao8ing-1-2', subjectId:'ao8-ing',  title:'Past Tense — Storytelling',         description:'Simple past and past continuous for telling stories',    term:1, displayOrder:2 },
  { id:'ao8ing-2-1', subjectId:'ao8-ing',  title:'Future Tenses — Plans & Predictions',description:'Will, going to and present continuous for future',      term:2, displayOrder:3 },
  { id:'ao8ing-2-2', subjectId:'ao8-ing',  title:'Reading Comprehension',             description:'Reading strategies, skimming, scanning and inference',   term:2, displayOrder:4 },
  { id:'ao8ing-3-1', subjectId:'ao8-ing',  title:'Comparative & Superlative Adjectives',description:'Angola and the world — comparisons in English',       term:3, displayOrder:5 },
  { id:'ao8ing-3-2', subjectId:'ao8-ing',  title:'Writing — Paragraphs and Letters',  description:'Formal and informal letters, email writing',             term:3, displayOrder:6 },

  // ══════════════════════════════════════════════════════════
  //  ANGOLA — 9ª Classe (ES1) — Currículo expandido
  // ══════════════════════════════════════════════════════════

  // ─── Matemática 9ª Classe ─────────────────────────────────
  { id:'ao9mat-1-1', subjectId:'ao9-mat',  title:'Conjuntos Numéricos — ℕ, ℤ, ℚ, ℝ', description:'Propriedades, operações e representação na recta real',   term:1, displayOrder:1 },
  { id:'ao9mat-1-2', subjectId:'ao9-mat',  title:'Funções — Conceito e Domínio',      description:'Definição, domínio, contradomínio e funções numéricas',   term:1, displayOrder:2 },
  { id:'ao9mat-1-3', subjectId:'ao9-mat',  title:'Função Afim e Quadrática',          description:'Gráficos, raízes, vértice e eixo de simetria',            term:1, displayOrder:3 },
  { id:'ao9mat-2-1', subjectId:'ao9-mat',  title:'Trigonometria no Triângulo Rect.',   description:'Seno, cosseno, tangente — tabela e calculadora',          term:2, displayOrder:4 },
  { id:'ao9mat-2-2', subjectId:'ao9-mat',  title:'Trigonometria — Problemas Aplicados',description:'Ângulos de elevação, depressão e distâncias inacessíveis', term:2, displayOrder:5 },
  { id:'ao9mat-2-3', subjectId:'ao9-mat',  title:'Progressões Aritméticas',           description:'Termo geral, soma dos termos e problemas',                term:2, displayOrder:6 },
  { id:'ao9mat-3-1', subjectId:'ao9-mat',  title:'Progressões Geométricas',           description:'Razão, termo geral, soma e juros compostos',              term:3, displayOrder:7 },
  { id:'ao9mat-3-2', subjectId:'ao9-mat',  title:'Estatística — Frequências e Histog.',description:'Tabelas de frequência, histogramas e polígono de frequências', term:3, displayOrder:8 },
  { id:'ao9mat-3-3', subjectId:'ao9-mat',  title:'Probabilidade — Eventos Compostos', description:'Eventos independentes, condicionais e combinações simples', term:3, displayOrder:9 },

  // ─── Língua Portuguesa 9ª Classe ─────────────────────────
  { id:'ao9por-1-1', subjectId:'ao9-port', title:'Literatura Angolana — Poesia',      description:'Agostinho Neto, Viriato da Cruz e António Jacinto',       term:1, displayOrder:1 },
  { id:'ao9por-1-2', subjectId:'ao9-port', title:'Literatura Angolana — Prosa',       description:'Luandino Vieira — "A Vida Verdadeira de Domingos Xavier"', term:1, displayOrder:2 },
  { id:'ao9por-1-3', subjectId:'ao9-port', title:'Figuras de Estilo e Análise Poética',description:'Metáfora, antítese, anáfora e versificação',             term:1, displayOrder:3 },
  { id:'ao9por-2-1', subjectId:'ao9-port', title:'Sintaxe — Orações Subordinadas',    description:'Substantivas, relativas, adverbiais e suas funções',      term:2, displayOrder:4 },
  { id:'ao9por-2-2', subjectId:'ao9-port', title:'Pepetela — Ficção Angolana',        description:'Análise de excertos de obras de Pepetela',                term:2, displayOrder:5 },
  { id:'ao9por-2-3', subjectId:'ao9-port', title:'Texto de Apreciação Crítica',       description:'Estrutura, argumentação e linguagem formal',              term:2, displayOrder:6 },
  { id:'ao9por-3-1', subjectId:'ao9-port', title:'Produção Textual — Dissertação',    description:'Tese, argumentação e proposta de solução',                term:3, displayOrder:7 },
  { id:'ao9por-3-2', subjectId:'ao9-port', title:'Preparação para Exame de Classe',   description:'Revisão geral e exercícios tipo exame nacional',          term:3, displayOrder:8 },
  { id:'ao9por-3-3', subjectId:'ao9-port', title:'Oralidade — Debate e Exposição',    description:'Técnicas de argumentação oral e debate estruturado',      term:3, displayOrder:9 },

  // ─── Ciências Físicas 9ª Classe ──────────────────────────
  { id:'ao9cf-1-1',  subjectId:'ao9-fis',  title:'Electricidade — Conceitos Básicos', description:'Carga eléctrica, corrente, tensão e resistência',         term:1, displayOrder:1 },
  { id:'ao9cf-1-2',  subjectId:'ao9-fis',  title:'Circuitos Eléctricos — Série/Paral.',description:'Leis de Kirchhoff, resistências em série e paralelo',    term:1, displayOrder:2 },
  { id:'ao9cf-1-3',  subjectId:'ao9-fis',  title:'Potência e Energia Eléctrica',      description:'Cálculo de consumo e factura de electricidade',           term:1, displayOrder:3 },
  { id:'ao9cf-2-1',  subjectId:'ao9-fis',  title:'Magnetismo',                        description:'Ímanes, campo magnético e bússola',                       term:2, displayOrder:4 },
  { id:'ao9cf-2-2',  subjectId:'ao9-fis',  title:'Electromagnetismo',                 description:'Lei de Faraday, indução e gerador eléctrico',             term:2, displayOrder:5 },
  { id:'ao9cf-3-1',  subjectId:'ao9-fis',  title:'Óptica — Reflexão e Espelhos',      description:'Lei da reflexão, espelhos planos e curvos',               term:3, displayOrder:6 },
  { id:'ao9cf-3-2',  subjectId:'ao9-fis',  title:'Óptica — Refracção e Lentes',       description:'Lei de Snell-Descartes, lentes e óculos',                 term:3, displayOrder:7 },
  { id:'ao9cf-3-3',  subjectId:'ao9-fis',  title:'Física Nuclear — Introdução',       description:'Radioactividade, isótopos e aplicações em Angola',        term:3, displayOrder:8 },

  // ─── Ciências Naturais 9ª Classe ─────────────────────────
  { id:'ao9nat-1-1', subjectId:'ao9-nat',  title:'Sistema Nervoso e Órgãos dos Sentidos',description:'Neurónios, reflexos e sistemas nervoso central e periférico', term:1, displayOrder:1 },
  { id:'ao9nat-1-2', subjectId:'ao9-nat',  title:'Sistema Circulatório e Imunitário', description:'Coração, vasos, sangue, anticorpos e vacinação',           term:1, displayOrder:2 },
  { id:'ao9nat-2-1', subjectId:'ao9-nat',  title:'Ecologia — Relações entre Organismos',description:'Predação, simbiose, parasitismo e competição',           term:2, displayOrder:3 },
  { id:'ao9nat-2-2', subjectId:'ao9-nat',  title:'Poluição e Ambiente em Angola',     description:'Poluição do ar, água e solo — impactos e soluções',       term:2, displayOrder:4 },
  { id:'ao9nat-3-1', subjectId:'ao9-nat',  title:'Saúde Pública — Doenças Tropicais', description:'Malária, tuberculose, febre-amarela — epidemiologia',     term:3, displayOrder:5 },
  { id:'ao9nat-3-2', subjectId:'ao9-nat',  title:'Biotecnologia — OGM e Vacinas',     description:'Engenharia genética, produção de vacinas e biofármacos', term:3, displayOrder:6 },
  { id:'ao9nat-3-3', subjectId:'ao9-nat',  title:'Evolução das Espécies',             description:'Darwin, selecção natural, adaptação e evidências da evolução', term:3, displayOrder:7 },

  // ─── História 9ª Classe ───────────────────────────────────
  { id:'ao9his-1-1', subjectId:'ao9-his',  title:'Angola no Século XIX — Resistência', description:'Guerras de resistência: Bailundo, Cuamato e Dembos',     term:1, displayOrder:1 },
  { id:'ao9his-1-2', subjectId:'ao9-his',  title:'Colonialismo Português em Angola',   description:'Sistema colonial, trabalho forçado e contrato',           term:1, displayOrder:2 },
  { id:'ao9his-2-1', subjectId:'ao9-his',  title:'Movimentos Nacionalistas Africanos', description:'Pan-africanismo e surgimento dos partidos angolanos',      term:2, displayOrder:3 },
  { id:'ao9his-2-2', subjectId:'ao9-his',  title:'MPLA, FNLA e UNITA — Luta Armada',  description:'Início da guerra de libertação em 1961 e protagonistas',  term:2, displayOrder:4 },
  { id:'ao9his-3-1', subjectId:'ao9-his',  title:'Revolução dos Cravos e Alvor',       description:'25 de Abril de 1974 e os Acordos de Alvor',               term:3, displayOrder:5 },
  { id:'ao9his-3-2', subjectId:'ao9-his',  title:'Independência e Guerra Civil',       description:'11 de Nov 1975, MPLA no poder e conflito interno (1975-2002)', term:3, displayOrder:6 },
  { id:'ao9his-3-3', subjectId:'ao9-his',  title:'Angola no Século XXI',               description:'Paz em 2002, reconstrução nacional e desenvolvimento',    term:3, displayOrder:7 },

  // ─── Geografia 9ª Classe ─────────────────────────────────
  { id:'ao9geo-1-1', subjectId:'ao9-geo',  title:'Globalização — Conceito e Causas',  description:'Globalização económica, cultural e tecnológica',           term:1, displayOrder:1 },
  { id:'ao9geo-1-2', subjectId:'ao9-geo',  title:'Angola e a SADC — Integração Regional',description:'Comunidade para o Desenvolvimento da África Austral',   term:1, displayOrder:2 },
  { id:'ao9geo-2-1', subjectId:'ao9-geo',  title:'Recursos Naturais de Angola',       description:'Petróleo, gás, diamantes, madeiras e pesca — exportações', term:2, displayOrder:3 },
  { id:'ao9geo-2-2', subjectId:'ao9-geo',  title:'Indústria e Energia em Angola',     description:'Indústria extractiva, barragem de Laúca e energias renov.', term:2, displayOrder:4 },
  { id:'ao9geo-3-1', subjectId:'ao9-geo',  title:'Problemas Ambientais Globais',      description:'Aquecimento global, desertificação e perda de biodiversidade', term:3, displayOrder:5 },
  { id:'ao9geo-3-2', subjectId:'ao9-geo',  title:'Desenvolvimento Sustentável',       description:'ODS — Objectivos de Desenvolvimento Sustentável e Angola',  term:3, displayOrder:6 },
  { id:'ao9geo-3-3', subjectId:'ao9-geo',  title:'Angola — Desenvolvimento Humano',   description:'IDH, educação, saúde e perspectivas para 2050',           term:3, displayOrder:7 },

  // ─── Língua Inglesa 9ª Classe ────────────────────────────
  { id:'ao9ing-1-1', subjectId:'ao9-ing',  title:'Present Perfect — Life Experiences',description:'Have/has + past participle, ever, never, already, yet',   term:1, displayOrder:1 },
  { id:'ao9ing-1-2', subjectId:'ao9-ing',  title:'Passive Voice',                     description:'Simple present and past passive — transformation exercises', term:1, displayOrder:2 },
  { id:'ao9ing-2-1', subjectId:'ao9-ing',  title:'Conditionals — If Clauses',         description:'Zero, first and second conditional sentences',            term:2, displayOrder:3 },
  { id:'ao9ing-2-2', subjectId:'ao9-ing',  title:'Reading — Texts about Angola',      description:'Comprehension, vocabulary and discussion on Angolan topics', term:2, displayOrder:4 },
  { id:'ao9ing-3-1', subjectId:'ao9-ing',  title:'Reported Speech',                   description:'Say and tell — statements, questions and commands',       term:3, displayOrder:5 },
  { id:'ao9ing-3-2', subjectId:'ao9-ing',  title:'Writing — Essays and Arguments',    description:'Opinion essays: structure and language for ENES preparation', term:3, displayOrder:6 },
  { id:'ao9ing-3-3', subjectId:'ao9-ing',  title:'Speaking — Presentations',          description:'Oral presentations on Angolan topics in English',          term:3, displayOrder:7 },

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

/**
 * Indica se uma classe pertence ao ensino primário/fundamental — crianças
 * até cerca de 12-13 anos (usa o limite superior de ageRange do nível de
 * ensino a que a classe pertence). Fonte de verdade para decidir quem vê a
 * dashboard simplificada/"divertida" em vez da dashboard normal — hoje só
 * afecta mz-1c..mz-7c (únicas classes populadas nesse intervalo etário),
 * mas estende-se automaticamente a outros países se as suas classes
 * primárias (ao-ep, br-ef1, pt-eb1/eb2, cv-eb) vierem a ser adicionadas.
 */
export const isChildGrade = (gradeId: string): boolean => {
  const grade = GRADES.find(g => g.id === gradeId)
  if (!grade) return false
  const level = EDUCATION_LEVELS.find(l => l.id === grade.levelId)
  if (!level) return false
  const ages = (level.ageRange.match(/\d+/g) || []).map(Number)
  if (!ages.length) return false
  return Math.max(...ages) <= 13
}

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
