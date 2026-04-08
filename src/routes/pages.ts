import { Hono } from 'hono'

const app = new Hono()

// Import HTML content as raw strings (will be handled by build)
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

// Serve HTML pages
app.get('/login.html', (c) => c.html(loginHtml))
app.get('/register.html', (c) => c.html(registerHtml))
app.get('/dashboard.html', (c) => c.html(dashboardHtml))
app.get('/browse.html', (c) => c.html(browseHtml))
app.get('/chapters.html', (c) => c.html(chaptersHtml))
app.get('/lesson.html', (c) => c.html(lessonHtml))
app.get('/progress.html', (c) => c.html(progressHtml))
app.get('/profile.html', (c) => c.html(profileHtml))
app.get('/library.html', (c) => c.html(libraryHtml))
app.get('/help.html', (c) => c.html(helpHtml))

export default app
