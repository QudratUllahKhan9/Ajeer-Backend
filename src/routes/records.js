import { Router } from 'express'
import { Permit } from '../models/Permit.js'
import { getBaseUrl, getFrontendUrl } from '../services/urlService.js'
import { qrTargetFor } from '../services/qrService.js'
import { sanitizeId } from '../services/idService.js'

const r = Router()
const PUB = ['permitId','permitNo','title','workerName','idNumber','profession','nationality','birthDate',
  'providerCompany','providerCr','beneficiaryCompany','beneficiaryCr','contractNote',
  'startDate','endDate','workSites','status','createdAt','updatedAt']

/**
 * The frontend page at <frontend>/v/<id> calls this. Same shape the app already expects.
 */
r.get('/:id', async (req, res, next) => {
  try {
    const id = sanitizeId(req.params.id)
    const doc = await Permit.findOne({ permitId: id }).lean()
    if (!doc) return res.status(404).json({ error: 'not found', permitId: id })
    const apiBase = await getBaseUrl()
    const out = {}
    for (const k of PUB) out[k] = doc[k]
    out.qrTarget = doc.qr?.targetUrl || qrTargetFor(apiBase, id)
    out.qrImageUrl = `${apiBase}/qr/${id}.png`
    out.pageUrl = `${await getFrontendUrl()}/v/${id}`   // 302 jahan jata hai
    res.set('Cache-Control', 'no-store')
    res.json(out)
  } catch (e) { next(e) }
})
export default r
