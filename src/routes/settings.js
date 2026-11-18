import { Router } from 'express'
import { env } from '../config/env.js'
import { getBaseUrl, getFrontendUrl, setUrls } from '../services/urlService.js'
import { regenerateAllQrs } from '../services/qrService.js'

const r = Router()
const admin = (req, res, next) => {
  const t = req.get('x-admin-token') || req.query.token
  if (t !== env.adminToken) return res.status(401).json({ error: 'admin token galat' })
  next()
}

// Dono '/' aur bina slash ke requests handle karne ke liye
r.get(['/', ''], async (_req, res, next) => {
  try {
    res.json({ publicBaseUrl: await getBaseUrl(), frontendBaseUrl: await getFrontendUrl() })
  } catch (e) { next(e) }
})

/** change the QR host (frontend) and/or the API host, then re-render every QR */
r.put(['/domain', '/domain/'], admin, async (req, res, next) => {
  try {
    const { baseUrl, frontendBaseUrl, regenerate = true } = req.body || {}
    const doc = await setUrls({ baseUrl, frontendBaseUrl }, 'url change via API')
    const report = regenerate && baseUrl ? await regenerateAllQrs() : null
    res.json({ ok: true, publicBaseUrl: doc.publicBaseUrl, frontendBaseUrl: doc.frontendBaseUrl, report })
  } catch (e) { next(e) }
})

export default r