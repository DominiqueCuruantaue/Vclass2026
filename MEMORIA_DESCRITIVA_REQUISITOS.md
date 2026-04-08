# VClass - Requisitos da Memória Descritiva

**Documento Base:** AVIMO - Plataforma de Aulas Virtuais de Moçambique  
**Data de Análise:** 2026-04-08

---

## 📋 ESTRUTURA GERAL

A plataforma conterá conteúdos de **1ª a 12ª Classe** do Sistema Nacional de Ensino de Moçambique.

---

## 1. PÁGINA INICIAL (HOME)

Composta por **4 páginas principais**:

### 1.1 PÁGINA 1 - Home Header

**Cabeçalho Primário:**
- ✅ Início
- ✅ Sobre
- ✅ Aulas Online
- ✅ Biblioteca
- ✅ Notícias
- ✅ Login

**Cabeçalho Secundário:**
- Slider de imagens (carrossel)

### 1.2 PÁGINA 2 - Lista de Classes

- Exibir classes de **1ª a 12ª** do Ensino Geral
- Cards clicáveis para cada classe
- Ao clicar, direciona para página de disciplinas

### 1.3 PÁGINA 3 - Cursos Adicionais

- Cursos online e offline de instituições parceiras
- Podem ser gratuitos ou pagos
- **Não obrigatórios** - objetivo: ajudar estudantes a escolher curso superior
- Cursos complementares aos estudos

### 1.4 PÁGINA 4 - Últimas Notícias

- Notícias atualizadas sobre educação
- Informações para estudantes e professores
- **Rodapé** com:
  - Informações da plataforma
  - Parceiros
  - Links de redes sociais
  - Professor virtual para dúvidas simples
  - Sugestões e denúncias

---

## 2. PÁGINA DE DISCIPLINAS

**Estrutura:**
- Cabeçalho principal
- **Corpo:** Lista de todas as disciplinas da classe
- Rodapé

**Funcionalidade:**
- Ao clicar em disciplina → vai para página de capítulos
- Capítulos subdivididos em **3 trimestres**

---

## 3. PÁGINA DE CAPÍTULOS

**Estrutura:**
- Cabeçalho
- **Unidades Temáticas** organizadas por trimestre:
  - 1º Trimestre
  - 2º Trimestre
  - 3º Trimestre
- Rodapé

**Funcionalidade:**
- Ao clicar em unidade temática → vai para página de aulas
- Aulas em formato de **vídeos** e **textos**

---

## 4. PÁGINA DE AULAS

**Layout em 3 colunas:**

### Coluna Esquerda:
- Lista de conteúdos do trimestre
- Navegação entre aulas

### Coluna Central:
- **Título da aula** (topo)
- **Vídeo aula** (meio)
- **Resumo do texto** (baixo)
- Botão "Ler mais..." para texto completo

### Coluna Direita (Sidebar):
1. **Exercícios** - para praticar após a aula
2. **Exames Anteriores** - preparação para exames
3. **Biblioteca** - livros nacionais e internacionais
4. **Encontros Agendados** - integração com Google Classroom

**Rodapé** na parte inferior

---

## 5. PÁGINA DE BIBLIOTECA

**Estrutura:**

### Coluna Esquerda:
- **Categorias de livros**
- **Pré-visualização dos livros**

### Corpo Principal:
- **Livros em destaque** (capas)
- Botão "Visualizar mais"
- Livros do Ensino Geral Nacional
- Livros Internacionais

**Funcionalidade:**
- Ao clicar → abre livro em formato slide
- Pesquisa de conteúdo específico dentro do livro

**Rodapé** na parte inferior

---

## 6. PÁGINA DE NOTÍCIAS

**Estrutura:**
- Cabeçalho
- **Coluna de destaque** (notícias principais)
- **Corpo:** últimas notícias com imagens e textos
- Rodapé

**Conteúdo:**
- Informações sobre educação
- Para estudantes e professores
- Notícias atualizadas regularmente

---

## 7. OUTRAS PÁGINAS (não detalhadas)

- **Sobre** - informações da plataforma
- **Login** - autenticação de usuários

---

## 🎯 FUNCIONALIDADES CHAVE

1. **Sistema de Trimestres** - organização por 3 trimestres
2. **Vídeo Aulas** - conteúdo em vídeo
3. **Texto/Resumos** - conteúdo escrito com "Ler mais"
4. **Exercícios** - prática após cada aula
5. **Exames Anteriores** - preparação
6. **Biblioteca Digital** - livros nacionais e internacionais
7. **Google Classroom** - encontros ao vivo
8. **Professor Virtual** - dúvidas simples via chat
9. **Notícias Educacionais** - informações atualizadas
10. **Cursos Adicionais** - complementares (pagos/gratuitos)

---

## 🎨 DESIGN REQUIREMENTS

1. **Cabeçalho** em todas as páginas
2. **Rodapé** em todas as páginas com:
   - Info da plataforma
   - Parceiros
   - Redes sociais
   - Contato
3. **Slider de imagens** na home
4. **Cards clicáveis** para classes/disciplinas
5. **Layout de 3 colunas** na página de aulas
6. **Sistema de navegação breadcrumb**
7. **Botões CTA** claros
8. **Responsivo** para mobile

---

## 📊 HIERARQUIA DE NAVEGAÇÃO

```
Home
 ├─ Classes (1ª - 12ª)
 │   └─ Disciplinas
 │       └─ Capítulos (por trimestre)
 │           └─ Aulas (vídeo + texto)
 │               ├─ Exercícios
 │               ├─ Exames Anteriores
 │               ├─ Biblioteca
 │               └─ Encontros Agendados
 │
 ├─ Cursos Adicionais
 │
 ├─ Biblioteca
 │
 └─ Notícias
```

---

## ✅ PRIORIDADES DE IMPLEMENTAÇÃO

### FASE 1 (Urgente):
1. Redesenhar Home com 4 seções
2. Implementar navegação Classes (1ª-12ª)
3. Página de Disciplinas
4. Página de Capítulos (trimestres)
5. Página de Aulas (layout 3 colunas)

### FASE 2 (Importante):
6. Biblioteca Digital
7. Exercícios interativos
8. Exames Anteriores
9. Notícias

### FASE 3 (Desejável):
10. Cursos Adicionais
11. Google Classroom integration
12. Professor Virtual (chatbot)
13. Sistema de pagamentos (cursos pagos)

---

## 📝 OBSERVAÇÕES DO DOCUMENTO

1. Algumas páginas não foram detalhadas (Sobre, Login)
2. Documento aberto a sugestões e críticas
3. Esta é apenas descrição de funcionalidades
4. Projeto principal contém informações mais detalhadas

---

**Status:** Documento analisado e requisitos extraídos  
**Próximo Passo:** Implementar redesign da plataforma
