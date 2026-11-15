import { Router } from 'express'
import { Permit } from '../models/Permit.js'
import { getBaseUrl } from '../services/urlService.js'
import { buildQr, qrTargetFor, recordApiUrlFor } from '../services/qrService.js'
import { makeId, sanitizeId } from '../services/idService.js'

const r = Router()

const FIELDS = ['permitNo','title','workerName','idNumber','profession','nationality','birthDate',
  'providerCompany','providerCr','beneficiaryCompany','beneficiaryCr','contractNote',
  'startDate','endDate','workSites','status']

const pick = (b = {}) => { const o = {}; for (const k of FIELDS) if (b[k] !== undefined) o[k] = String(b[k] ?? ''); return o }


/** one shape for every response: record + the link the QR contains */
export function decorate(doc, apiBase) {
  const p = doc.toObject ? doc.toObject() : { ...doc }
  p.qrTarget = p.qr?.targetUrl || qrTargetFor(apiBase, p.permitId)
  p.pageUrl = p.qrTarget
  p.qrImageUrl = `${apiBase}/qr/${p.permitId}.png`
  p.apiRecordUrl = recordApiUrlFor(apiBase, p.permitId)
  return p
}

r.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim()
    const filter = q ? { $or: [
      { permitNo: new RegExp(q, 'i') }, { workerName: new RegExp(q, 'i') },
      { idNumber: new RegExp(q, 'i') }, { permitId: new RegExp(q, 'i') }
    ] } : {}
    const items = await Permit.find(filter).sort({ createdAt: -1 }).limit(100).lean()
    res.json({ items, count: items.length })
  } catch (e) { next(e) }
})

r.get('/:id', async (req, res, next) => {
  try {
    const id = sanitizeId(req.params.id)
    const doc = await Permit.findOne({ permitId: id })
    if (!doc) return res.status(404).json({ error: 'not found', permitId: id })
    const apiBase = await getBaseUrl()
    res.set('Cache-Control', 'no-store')
    res.json({ ok: true, permit: decorate(doc, apiBase) })
  } catch (e) { next(e) }
})

r.post('/', async (req, res, next) => {
  try {
    const body = pick(req.body)
    if (!body.workerName && !body.permitNo) return res.status(400).json({ error: 'workerName ya permitNo zaroori hai' })

    // id: user ki di hui (long bhi) warna permitNo se, warna random 44-char
    const permitId = makeId(req.body?.permitId, body.permitNo)
    if (await Permit.findOne({ permitId }).lean()) {
      return res.status(409).json({ error: 'permitId pehle se mojood hai', permitId })
    }

    const qr = await buildQr(permitId)
    const doc = await Permit.create({
      permitId, ...body,
      qr: {
        targetUrl: qr.targetUrl, imageUrl: qr.imageUrl, apiRecordUrl: qr.apiRecordUrl,
        publicId: `qr_${permitId}`, baseUrl: qr.baseUrl, generatedAt: qr.generatedAt
      }
    })
    const apiBase = await getBaseUrl()
    res.status(201).json({ ok: true, permit: decorate(doc, apiBase), url: qr.targetUrl, qrImageUrl: qr.imageUrl })
  } catch (e) { next(e) }
})

r.put('/:id', async (req, res, next) => {
  try {
    const id = sanitizeId(req.params.id)
    const doc = await Permit.findOneAndUpdate({ permitId: id }, { $set: pick(req.body) }, { new: true })
    if (!doc) return res.status(404).json({ error: 'not found', permitId: id })
    const apiBase = await getBaseUrl()
    // text edit never changes the QR target — the record itself is edited in place
    await Permit.updateOne({ permitId: id }, { $set: {
      'qr.targetUrl': qrTargetFor(apiBase, id), 'qr.baseUrl': apiBase,
      'qr.imageUrl': `${apiBase}/qr/${id}.png`, 'qr.apiRecordUrl': recordApiUrlFor(apiBase, id)
    } })
    doc.qr = { ...(doc.qr || {}), targetUrl: qrTargetFor(apiBase, id), baseUrl: apiBase }
    res.json({ ok: true, permit: decorate(doc, apiBase) })
  } catch (e) { next(e) }
})

r.delete('/:id', async (req, res, next) => {
  try {
    const id = sanitizeId(req.params.id)
    const out = await Permit.deleteOne({ permitId: id })
    if (!out.deletedCount) return res.status(404).json({ error: 'not found' })
    res.json({ ok: true, deleted: id })
  } catch (e) { next(e) }
})

export default r
