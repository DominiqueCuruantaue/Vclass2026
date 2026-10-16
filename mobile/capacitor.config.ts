import type { CapacitorConfig } from '@capacitor/cli'

// A app não empacota HTML/CSS/JS localmente: a VClass é renderizada no
// servidor (Hono em Cloudflare Workers), por isso a WebView carrega
// diretamente a URL de produção. Isto garante que o layout mobile é
// sempre idêntico ao da web, sem duplicar nem re-implementar ecrãs.
// O comportamento "de app" (botão voltar, ripple, puxar para actualizar,
// transições, vibração) vive em /static/app.js e só liga dentro do APK.
const config: CapacitorConfig = {
  appId: 'mz.co.vclass.app',
  appName: 'VClass',
  webDir: 'www',
  // Permite ao servidor/CSS distinguir a app do browser, se for preciso.
  appendUserAgent: 'VClassApp/1.0',
  backgroundColor: '#ffffff',
  server: {
    // Entra directo no login (sem landing page) — quem já tem sessão
    // válida é logo redireccionado para o dashboard certo pelo próprio
    // login.html (VClass.isAuthenticated()).
    url: 'https://vclass.co.mz/login.html',
    androidScheme: 'https',
    cleartext: false,
    // Sem rede no arranque: ecrã próprio da app em vez da página de
    // erro do Chrome ("Página Web não disponível").
    errorPath: 'offline.html'
  },
  android: {
    allowMixedContent: false
  },
  plugins: {
    SplashScreen: {
      // O splash fica até a primeira página estar pintada (app.js chama
      // SplashScreen.hide()), em vez de fechar às cegas e mostrar um ecrã
      // branco enquanto o servidor responde. launchShowDuration é só o
      // limite de segurança se a página nunca chegar a chamar hide().
      launchAutoHide: true,
      launchShowDuration: 6000,
      launchFadeOutDuration: 250,
      backgroundColor: '#0f172a',
      showSpinner: false
    },
    SystemBars: {
      // Ícones escuros nas barras do sistema (o fundo da app é branco).
      style: 'LIGHT'
    }
  }
}

export default config
