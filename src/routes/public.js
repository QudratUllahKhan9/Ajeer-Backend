import { Router } from 'express'
import { Permit } from '../models/Permit.js'
import { getBaseUrl, getFrontendUrl } from '../services/urlService.js'
import { makeQrPng, qrTargetFor } from '../services/qrService.js'
import { sanitizeId } from '../services/idService.js'
import { env } from '../config/env.js'

const r = Router()
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/* GET /qr/:id.png — 1024px square navy QR. Payload = <backend>/v/<id> */
r.get('/qr/:id.png', async (req, res, next) => {
  try {
    const id = sanitizeId(req.params.id)
    const base = await getBaseUrl()
    const png = await makeQrPng(qrTargetFor(base, id))
    res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'no-store' })
    res.send(png)
  } catch (e) { next(e) }
})

/**
 * GET /v/:id  ← QR ka target (backend par)
 * Record Mongo me milta hai to 302 → <FRONTEND_URL>/v/<same id>
 * na mile to 404. Frontend page usi id se data uthata hai.
 */
r.get('/v/:id', async (req, res, next) => {
  try {
    const id = sanitizeId(req.params.id)
    const doc = await Permit.findOne({ permitId: id }).lean()
    if (!doc) {
      return res.status(404).type('html').send(`<!doctype html><html lang="ur" dir="rtl"><meta charset="utf-8">
<body style="font-family:system-ui;padding:40px;text-align:center">
<h1>ریکارڈ نہیں ملا / Record not found</h1><p style="color:#667085" dir="ltr">${esc(id)}</p></body></html>`)
    }

    const fe = await getFrontendUrl()
    const target = `${fe}/v/${encodeURIComponent(doc.permitId)}`

    // default: browser ko frontend page par bhej do (wahi id)
    if (env.redirectMode !== 'page' && fe) {
      res.set('Cache-Control', 'no-store')
      return res.redirect(302, target)
    }
    res.set('Cache-Control', 'no-store')
    res.type('html').send(renderHtml(doc, doc.permitId, await getBaseUrl()))
  } catch (e) { next(e) }
})

function renderHtml(d, id, base) {
  const now = new Date()
  const expired = d.endDate && now > new Date(d.endDate)
  const pending = d.startDate && now < new Date(d.startDate)
  const [label, fg, bg, bd] = expired ? ['منتهي', '#8C1D18', '#FDECEA', '#F5C2BE']
    : pending ? ['لم يبدأ بعد', '#8A5A00', '#FFF7E6', '#F5D9A0']
    : ['ساري / فعال', '#0B5137', '#E7F6EE', '#BFE7D2']
  const cells = (pairs) => pairs.map(([l, v, cn = '']) => `<tr><th>${esc(l)}</th><td class="${cn}">${esc(v || '—')}</td></tr>`).join('')
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.title || 'بيانات السجل')}</title>
<style>*{box-sizing:border-box}body{margin:0;background:#F4F6F9;color:#0F172A;line-height:1.95;font-family:"Noto Naskh Arabic","Segoe UI",Tahoma,Arial,sans-serif}
.wrap{max-width:780px;margin:0 auto;padding:18px}.card{background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:22px 24px;box-shadow:0 10px 28px rgba(16,24,40,.08)}
.hd{display:flex;align-items:center;gap:14px;border-bottom:2px solid #2D7A58;padding-bottom:14px;margin-bottom:16px;flex-wrap:wrap}
.logo{font-size:26px;font-weight:700;color:#2D7A58}.t{flex:1;min-width:170px}.t strong{display:block;font-size:15.5px}.t span{font-size:11.5px;color:#6B7280}
.st{font-size:11.5px;font-weight:700;padding:6px 14px;border-radius:999px;background:${bg};color:${fg};border:1px solid ${bd}}
.band{background:#EBF0F1;border:1px solid #CECFD5;border-bottom:0;font-size:12.5px;font-weight:700;padding:7px 12px;margin-top:14px}
table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #CECFD5;padding:8px 10px;font-size:12px;line-height:1.85}
th{background:#F7F8FA;text-align:right;color:#374151;width:34%}td{color:#000;word-break:break-word}
.ltr{direction:ltr;text-align:left;unicode-bidi:isolate}
.foot{display:flex;gap:20px;margin-top:20px;padding-top:16px;border-top:1px solid #E5E7EB;flex-wrap:wrap}
.foot img{width:148px;height:148px;border:1px solid #E5E7EB;border-radius:6px;background:#fff;padding:5px}
.meta{flex:1;min-width:200px;font-size:11px;color:#667085}
.meta code{display:block;direction:ltr;text-align:left;word-break:break-all;background:#F3F4F6;border:1px solid #E5E7EB;border-radius:6px;padding:6px 8px;margin-top:4px;color:#111827}
</style></head><body><div class="wrap"><div class="card">
<div class="hd"><span class="logo">أجير</span><div class="t"><strong>${esc(d.title || 'بيانات السجل')}</strong>
<span>تم التحقق من البيانات مباشرة من قاعدة البيانات</span></div><span class="st">${label}</span></div>
<div class="band">بيانات التصريح</div><table>${cells([['رقم التصريح', d.permitNo, 'ltr'], ['نوع التصريح', d.title], ['تاريخ البداية', d.startDate, 'ltr'], ['تاريخ النهاية', d.endDate, 'ltr']])}</table>
<div class="band">بيانات العامل</div><table>${cells([['اسم العامل', d.workerName, 'ltr'], ['رقم الهوية / الإقامة', d.idNumber, 'ltr'], ['المهنة', d.profession], ['الجنسية', d.nationality]])}</table>
<div class="band">بيانات المنشأة</div><table>${cells([['المنشأة', d.providerCompany], ['السجل التجاري', d.providerCr, 'ltr'], ['المستفيد', d.beneficiaryCompany], ['مواقع العمل', d.workSites]])}</table>
<div class="foot"><img src="/qr/${esc(id)}.png" alt="QR"><div class="meta">ID <b dir="ltr">${esc(id)}</b>
<code>${esc(d.qr?.targetUrl || '')}</code></div></div></div></div></body></html>`
}
export default r
