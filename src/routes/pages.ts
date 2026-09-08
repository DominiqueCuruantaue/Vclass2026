import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { CloudflareBindings } from '../types/bindings'
import { verifyRefreshToken } from '../utils/jwt'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// ── Cache-Control: força o browser a nunca usar cache para páginas HTML ──────
// Resolve o problema de actualizações não aparecerem sem Ctrl+F5
app.use('/*', async (c, next) => {
  await next()
  if (c.res.headers.get('content-type')?.includes('text/html')) {
    c.res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    c.res.headers.set('Pragma', 'no-cache')
    c.res.headers.set('Expires', '0')
  }
})

// ── Guard de sessão para painéis privilegiados (achado F7 da auditoria 2026-08) ──
// Reaproveita o cookie HttpOnly `vclass_rt` (já emitido no login/registo em auth.ts)
// para exigir sessão válida no servidor antes de servir o HTML destes painéis —
// antes só havia o guard client-side (`VClass.isAuthenticated()`), que um pedido
// directo (curl, sem JS) contornava. A verificação é apenas "sessão válida"
// (assinatura + expiração do refresh token); a autorização por role continua,
// como sempre, a cargo da API que cada painel chama.
function requireSession(c: any) {
  const refreshToken = getCookie(c, 'vclass_rt')
  if (!refreshToken) return false
  return !!verifyRefreshToken(refreshToken, c.env?.JWT_SECRET)
}

app.use('/creator-dashboard.html', privilegedGuard)
app.use('/creator-content.html', privilegedGuard)
app.use('/creator-lesson-editor.html', privilegedGuard)
app.use('/creator-students.html', privilegedGuard)
app.use('/creator-analytics.html', privilegedGuard)
app.use('/creator-earnings.html', privilegedGuard)
app.use('/admin-dashboard.html', privilegedGuard)
app.use('/support-dashboard.html', privilegedGuard)
app.use('/editor-dashboard.html', privilegedGuard)
app.use('/country-dashboard.html', privilegedGuard)
app.use('/finance-dashboard.html', privilegedGuard)
app.use('/moderator-dashboard.html', privilegedGuard)
app.use('/teacher-verification.html', privilegedGuard)

async function privilegedGuard(c: any, next: any) {
  if (!requireSession(c)) {
    return c.redirect('/login.html', 302)
  }
  await next()
}

// Import HTML content as raw strings (will be handled by build)
import homeHtml from '../pages/home.html?raw'
import loginHtml from '../pages/login.html?raw'
import registerHtml from '../pages/register.html?raw'
import dashboardHtml from '../pages/dashboard.html?raw'
import browseHtml from '../pages/browse.html?raw'
import chaptersHtml from '../pages/chapters.html?raw'
import lessonHtml from '../pages/lesson.html?raw'
import progressHtml from '../pages/progress.html?raw'
import profileHtml from '../pages/profile.html?raw'
import libraryHtml from '../pages/library.html?raw'
import helpHtml from '../pages/help.html?raw'
import notificationsHtml from '../pages/notifications.html?raw'
import achievementsHtml from '../pages/achievements.html?raw'
import chatHtml from '../pages/chat.html?raw'
import newsHtml from '../pages/news.html?raw'
import searchHtml from '../pages/search.html?raw'
import testBrowseHtml from '../pages/test-browse.html?raw'
import creatorDashboardHtml from '../pages/creator-dashboard.html?raw'
import creatorContentHtml from '../pages/creator-content.html?raw'
import creatorLessonEditorHtml from '../pages/creator-lesson-editor.html?raw'
import creatorStudentsHtml from '../pages/creator-students.html?raw'
import creatorAnalyticsHtml from '../pages/creator-analytics.html?raw'
import adminDashboardHtml from '../pages/admin-dashboard.html?raw'
import supportDashboardHtml from '../pages/support-dashboard.html?raw'
import editorDashboardHtml from '../pages/editor-dashboard.html?raw'
import countryDashboardHtml from '../pages/country-dashboard.html?raw'
import financeDashboardHtml from '../pages/finance-dashboard.html?raw'
import moderatorDashboardHtml from '../pages/moderator-dashboard.html?raw'
import registerTeacherHtml from '../pages/register-teacher.html?raw'
import teacherVerificationHtml from '../pages/teacher-verification.html?raw'
import plansHtml from '../pages/plans.html?raw'
import bookmarksHtml from '../pages/bookmarks.html?raw'
import transfersHtml from '../pages/transfers.html?raw'
import creatorEarningsHtml from '../pages/creator-earnings.html?raw'

// Serve HTML pages
app.get('/', (c) => c.html(homeHtml))
app.get('/home.html', (c) => c.html(homeHtml))
app.get('/login.html', (c) => c.html(loginHtml))
app.get('/register.html', (c) => c.html(registerHtml))
app.get('/dashboard.html', (c) => c.html(dashboardHtml))
app.get('/browse.html', (c) => c.html(browseHtml))
app.get('/chapters.html', (c) => c.html(chaptersHtml))
app.get('/lesson.html', (c) => c.html(lessonHtml))
app.get('/progress.html', (c) => c.html(progressHtml))
app.get('/profile.html', (c) => c.html(profileHtml))
app.get('/library.html', (c) => c.html(libraryHtml))
app.get('/bookmarks.html', (c) => c.html(bookmarksHtml))
app.get('/transfers.html', (c) => c.html(transfersHtml))
app.get('/help.html',    (c) => c.html(helpHtml))
app.get('/support.html', (c) => c.html(helpHtml))   // alias
app.get('/notifications.html', (c) => c.html(notificationsHtml))
app.get('/achievements.html', (c) => c.html(achievementsHtml))
app.get('/chat.html', (c) => c.html(chatHtml))
app.get('/news.html', (c) => c.html(newsHtml))
app.get('/search.html', (c) => c.html(searchHtml))
app.get('/test-browse.html', (c) => c.html(testBrowseHtml))

// Creator Panel Pages
app.get('/creator-dashboard.html',    (c) => c.html(creatorDashboardHtml))
app.get('/creator-content.html',      (c) => c.html(creatorContentHtml))
app.get('/creator-lesson-editor.html',(c) => c.html(creatorLessonEditorHtml))
app.get('/creator-students.html',     (c) => c.html(creatorStudentsHtml))
app.get('/creator-analytics.html',    (c) => c.html(creatorAnalyticsHtml))

// Admin Panel
app.get('/admin-dashboard.html', (c) => c.html(adminDashboardHtml))

// Support Panel
app.get('/support-dashboard.html', (c) => c.html(supportDashboardHtml))

// Management Panels (4 novos roles)
app.get('/editor-dashboard.html',    (c) => c.html(editorDashboardHtml))
app.get('/country-dashboard.html',   (c) => c.html(countryDashboardHtml))
app.get('/finance-dashboard.html',   (c) => c.html(financeDashboardHtml))
app.get('/moderator-dashboard.html', (c) => c.html(moderatorDashboardHtml))

// Teacher Verification Flow
app.get('/register-teacher.html',    (c) => c.html(registerTeacherHtml))
app.get('/teacher-verification.html',(c) => c.html(teacherVerificationHtml))

// Plans & Pricing
app.get('/plans.html', (c) => c.html(plansHtml))

// Creator Earnings
app.get('/creator-earnings.html', (c) => c.html(creatorEarningsHtml))

export default app
