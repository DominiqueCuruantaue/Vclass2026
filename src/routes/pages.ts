import { Hono } from 'hono'

const app = new Hono()

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

export default app
