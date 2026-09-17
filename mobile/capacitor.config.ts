import type { CapacitorConfig } from '@capacitor/cli'

// A app não empacota HTML/CSS/JS localmente: a VClass é renderizada no
// servidor (Hono em Cloudflare Workers), por isso a WebView carrega
// diretamente a URL de produção. Isto garante que o layout mobile é
// sempre idêntico ao da web, sem duplicar nem re-implementar ecrãs.
const config: CapacitorConfig = {
  appId: 'mz.co.vclass.app',
  appName: 'VClass',
  webDir: 'www',
  server: {
    // Entra directo no login (sem landing page) — quem já tem sessão
    // válida é logo redireccionado para o dashboard certo pelo próprio
    // login.html (VClass.isAuthenticated()).
    url: 'https://vclass.co.mz/login.html',
    androidScheme: 'https',
    cleartext: false
  },
  android: {
    allowMixedContent: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0f172a',
      showSpinner: false
    }
  }
}

export default config
