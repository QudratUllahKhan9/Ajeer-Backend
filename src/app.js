import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { connectDb, isDbReady } from './config/db.js'
import permits from './routes/permits.js'
import records from './routes/records.js'
import settings from './routes/settings.js'
import publicRoutes from './routes/public.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '2mb' }))
  app.use(cors({
    origin: (o, cb) => (!o || env.webOrigins.includes(o) || /\.vercel\.app$|\.netlify\.app$|^http:\/\/localhost:\d+$/.test(o)) ? cb(null, true) : cb(null, true),
    credentials: true
  }))

  // serverless: DB lazily connect ho, phir request aage jaye
  app.use(async (_req, _res, next) => {
    try { await connectDb(); next() } catch (e) { next(e) }
  })

  app.get('/api/health', (_req, res) => res.json({ ok: true, db: isDbReady(), engine: 'mongodb+qrcode', runtime: process.env.VERCEL ? 'vercel' : 'node' }))
  app.use('/api/permits', permits)
  app.use('/api/records', records)
  app.use('/api/settings', settings)
  app.use('/', publicRoutes)

  app.use((err, _req, res, _next) => {
    console.error('[err]', err.message)
    res.status(err.status || 500).json({ error: err.message || 'server error' })
  })
  return app
}

export const app = createApp()
export default app
