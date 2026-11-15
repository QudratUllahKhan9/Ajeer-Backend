import { env } from '../config/env.js'
import { UrlConfig } from '../models/UrlConfig.js'

const clean = (v) => String(v || '').replace(/\/+$/, '')
const valid = (u) => /^https?:\/\/[^\s]+$/i.test(u)

/** QR host + API host (backend). Mongo first, .env fallback. */
export async function getBaseUrl() {
  const d = await UrlConfig.findOne({ key: 'global' }).lean()
  return clean(d?.publicBaseUrl || env.publicBaseUrl)
}

/** Scan hone par jis frontend par bhejna hai. QR me NAHI jata. */
export async function getFrontendUrl() {
  const d = await UrlConfig.findOne({ key: 'global' }).lean()
  return clean(d?.frontendBaseUrl || env.frontendUrl)
}
export const getFrontendBaseUrl = getFrontendUrl

export async function setUrls({ baseUrl, frontendBaseUrl } = {}, note = '') {
  const patch = {}
  if (baseUrl) {
    if (!valid(clean(baseUrl))) { const e = new Error('URL http:// ya https:// se shuru ho'); e.status = 400; throw e }
    patch.publicBaseUrl = clean(baseUrl)
  }
  if (frontendBaseUrl !== undefined && frontendBaseUrl !== '') {
    if (!valid(clean(frontendBaseUrl))) { const e = new Error('frontend URL http:// ya https:// se shuru ho'); e.status = 400; throw e }
    patch.frontendBaseUrl = clean(frontendBaseUrl)
  }
  const old = await UrlConfig.findOne({ key: 'global' }).lean()
  const history = [
    ...(old?.history || []).slice(-49),
    { publicBaseUrl: patch.publicBaseUrl || old?.publicBaseUrl, frontendBaseUrl: patch.frontendBaseUrl ?? old?.frontendBaseUrl, changedAt: new Date(), note }
  ]
  return UrlConfig.findOneAndUpdate({ key: 'global' }, { key: 'global', ...patch, history },
    { upsert: true, new: true, setDefaultsOnInsert: true }).lean()
}
