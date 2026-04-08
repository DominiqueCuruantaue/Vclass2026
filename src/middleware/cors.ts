// CORS Middleware Configuration
import { cors } from 'hono/cors'

export const corsConfig = cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://vclass.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400, // 24 hours
  credentials: true
})
