# VClass Mobile (Android)

Wrapper nativo Android feito com [Capacitor](https://capacitorjs.com/), que abre
`https://vclass.co.mz` dentro de uma WebView. Não é uma reimplementação dos
ecrãs — é a própria aplicação web, por isso o layout mobile é sempre
idêntico ao da web (mesmo HTML/CSS/JS, mesmas atualizações, sem duplicar
lógica nem correr o risco dos dois ficarem dessincronizados).

Substitui a antiga app Expo/React Native (ecrãs próprios, build via EAS),
removida por já não ser necessária.

## Como funciona

- `capacitor.config.ts` define `server.url = "https://vclass.co.mz"` — a
  WebView carrega sempre a versão de produção da web.
- `www/index.html` é apenas um ecrã de fallback (sem internet); não é
  empacotado como conteúdo real da app.
- Não há build do frontend a correr aqui — o `npm run build` da app web
  (raiz do repositório) não é necessário para gerar o APK.

Implicação: a app precisa de internet para funcionar (não há modo offline).

## Estrutura

```
mobile/
├── android/              # Projeto nativo Android (gerado pelo Capacitor)
├── www/                  # Fallback local mínimo (offline)
├── capacitor.config.ts   # Configuração do Capacitor (URL do servidor, appId, etc.)
└── package.json
```

## Desenvolvimento local

Pré-requisitos: Node 20+, JDK 17+ e Android SDK (ou Android Studio) instalados.

```bash
npm install
npx cap sync android      # copia config/plugins para o projeto nativo
npx cap open android      # abre no Android Studio
```

Depois de qualquer alteração a `capacitor.config.ts` ou aos plugins
instalados, corra `npx cap sync android` novamente.

## Gerar o APK

### Via GitHub Actions (recomendado, sem instalar Android SDK localmente)

O workflow [`.github/workflows/android-apk.yml`](../.github/workflows/android-apk.yml)
instala o JDK e as ferramentas de linha de comando do Android SDK, corre
`npx cap sync android` e depois `./gradlew assembleDebug` dentro de
`android/`. O APK fica disponível como artifact do workflow.

Para gerar: aba **Actions** do repositório → workflow **Build Android APK
(Capacitor)** → **Run workflow**. Ou faz push de alterações dentro de
`mobile/**` na branch `main`.

### Localmente

```bash
npx cap sync android
cd android
./gradlew assembleDebug   # Linux/Mac
gradlew.bat assembleDebug # Windows
```

O APK fica em `android/app/build/outputs/apk/debug/app-debug.apk`.

## Publicar (build de release)

O workflow atual gera apenas builds `debug` (não assinados, só para testes).
Para publicar na Play Store é preciso:

1. Gerar uma keystore de assinatura e guardá-la como secret no GitHub
   (nunca commitar a keystore nem a password no repositório).
2. Configurar a assinatura em `android/app/build.gradle`
   (`signingConfigs` + `buildTypes.release`).
3. Alterar o passo final do workflow para `./gradlew assembleRelease` (ou
   `bundleRelease` para gerar `.aab`).
