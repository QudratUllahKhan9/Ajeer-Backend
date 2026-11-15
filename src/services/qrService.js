import QRCode from 'qrcode'
import { Permit } from '../models/Permit.js'
import { getBaseUrl } from './urlService.js'

/** QR payload = BACKEND url + id →  https://api.yourdomain.com/v/b283254a */
export function qrTargetFor(baseUrl, permitId) {
  return `${String(baseUrl).replace(/\/+$/, '')}/v/${permitId}`
}
export function scanUrlFor(baseUrl, permitId) {
  return qrTargetFor(baseUrl, permitId)
}
export function recordApiUrlFor(baseUrl, permitId) {
  return `${String(baseUrl).replace(/\/+$/, '')}/api/records/${permitId}`
}

/** square, sharp modules, deep navy #0B1736 on white, ECC M, quiet zone 4 modules */
export const QR_LOOK = { margin: 4, width: 1024, errorCorrectionLevel: 'M', type: 'png', color: { dark: '#0B1736FF', light: '#FFFFFFFF' } }
export const makeQrPng = (target, opts = {}) => QRCode.toBuffer(target, { ...QR_LOOK, ...opts })

export async function buildQr(permitId) {
  const base = await getBaseUrl()
  const targetUrl = qrTargetFor(base, permitId)
  const png = await makeQrPng(targetUrl)
  return { targetUrl, png, baseUrl: base, imageUrl: `${base}/qr/${permitId}.png`, apiRecordUrl: recordApiUrlFor(base, permitId), generatedAt: new Date() }
}

/** Re-render every stored QR against the current backend host. */
export async function regenerateAllQrs() {
  const base = await getBaseUrl()
  const docs = await Permit.find({}, { permitId: 1 }).lean()
  for (const d of docs) {
    const target = qrTargetFor(base, d.permitId)
    await makeQrPng(target)
    await Permit.updateOne({ permitId: d.permitId }, { $set: {
      'qr.targetUrl': target, 'qr.imageUrl': `${base}/qr/${d.permitId}.png`,
      'qr.apiRecordUrl': recordApiUrlFor(base, d.permitId), 'qr.baseUrl': base, 'qr.generatedAt': new Date()
    } })
  }
  return { base, total: docs.length, updated: docs.length }
}
