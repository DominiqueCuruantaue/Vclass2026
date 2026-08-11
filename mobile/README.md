# VClass Mobile

App móvel (Expo + React Native) para os perfis **Estudante** e **Professor**
da VClass. Consome directamente a API existente (`src/routes/*` na raiz do
repositório) — não altera nem duplica o backend/web actuais.

Os restantes seis papéis (Admin, Editor, Gestor de País, Financeiro,
Moderador, Suporte) são painéis de staff densos, pensados para ecrã largo, e
continuam apenas na versão web (ver `fluxo-funcionamento.txt` na raiz).

## Stack

- Expo SDK 57 + `expo-router` (navegação por ficheiros, com grupos
  `(auth)` / `(student)` / `(teacher)`)
- TypeScript, tema navy/verde alinhado com o redesign web recente
- `expo-video` (leitor HLS), `expo-secure-store` (token), `expo-document-picker`
  (upload de documentos/vídeo), `tus-js-client` (upload resumível para o
  Bunny.net Stream)
- `shared/types/` — tipos TS partilhados com o backend (mantidos manualmente
  em sincronia com `src/types/index.ts`)

## Correr localmente

```bash
cd mobile
npm install   # já feito nesta sessão, mas fica documentado
npx expo start
```

Abre no telemóvel com a app **Expo Go** (lê o QR code) ou num emulador
Android/iOS (`npx expo start --android` / `--ios`).

### Apontar para a API

Por omissão, o app aponta para `http://localhost:3000` (ver
`mobile/app.json` → `extra.apiBaseUrl`). Num dispositivo físico ou emulador,
`localhost` **não** aponta para a tua máquina de desenvolvimento — cria um
`.env` em `mobile/` com o IP da tua máquina na rede local:

```
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
```

e corre o backend normalmente a partir da raiz do repositório (`npm run dev`).

## Autenticação

O access token (JWT, 8h) é guardado com `expo-secure-store`. O refresh token
continua a viver num cookie `HttpOnly` definido pelo backend — o stack de
rede nativo do iOS/Android mantém esse cookie automaticamente entre pedidos
ao mesmo host, tal como um browser, por isso o fluxo de refresh
(`mobile/src/api/client.ts`) funciona sem bibliotecas extra de cookies.

## Estrutura

```
mobile/
  app/                    ← rotas (expo-router)
    (auth)/                 login, registo de estudante, candidatura de
                             professor, ecrã para papéis de staff
    (student)/(tabs)/       início, explorar, progresso, biblioteca, perfil
    (student)/               lição (vídeo+exercícios), biblioteca (detalhe),
                             perfil (editar/planos), notificações, ajuda,
                             conquistas
    (teacher)/(tabs)/       visão geral, conteúdos, alunos, ganhos
    (teacher)/               editor de lição (5 abas), analytics
  src/
    api/                   um módulo por área da API (auth, curriculum,
                             progress, exercises, video, creator, ...)
    components/ui.tsx       biblioteca de componentes reutilizáveis
    context/AuthContext.tsx estado de autenticação global
    theme/colors.ts         paleta partilhada com o tema web

shared/types/               tipos TS partilhados entre web e mobile
```

## Limitações conhecidas (MVP)

- **Recursos da lição** (anexos/PDFs no editor do professor): ainda só na
  versão web — a aba "Recursos" no editor mobile mostra um aviso.
- **Criar capítulo** no mobile não associa `grade_subject_id`/currículo (essa
  lógica de resolução de slugs vive só no backend/web); o capítulo fica
  criado mas só aparece no Explorar dos alunos depois de associado à
  disciplina/classe pela versão web (Conteúdos), tal como já documentado em
  `src/routes/creator.ts`.
- Sem suporte offline — todas as chamadas exigem ligação à API.
