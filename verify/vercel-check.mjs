import { MongoMemoryServer } from 'mongodb-memory-server'
import jsQR from 'jsqr'
import { PNG } from 'pngjs'

let fails = 0
const ok = (n, c, x = '') => { console.log(`${c ? '✔' : '✘'} ${n}${x ? ' — ' + x : ''}`); if (!c) fails++ }

const mongo = await MongoMemoryServer.create()
// Vercel jaisa env — VERCEL=1 set hai, phir bhi koi listen nahi hona chahiye
process.env.VERCEL = '1'
process.env.MONGODB_URI = mongo.getUri('ajeer')
process.env.PUBLIC_BASE_URL = 'https://ajeer-api.vercel.app'
process.env.FRONTEND_URL = 'https://ajeer-qiwa-sa-five.vercel.app'
process.env.REDIRECT_MODE = 'redirect'
process.env.ADMIN_TOKEN = 'tok'

// index.js ko load karo (jo Vercel karta hai)
const mod = await import('../index.js')
const app = mod.default
ok('index.js default-export = express app', typeof app === 'function', typeof app)

// harness khud listen karta hai — app nahi
const srv = app.listen(0)
const port = srv.address().port
const API = `http://127.0.0.1:${port}`

const LONG = '122111111111bbnbnc121cv12cvc1212cc21vc2v1c2'
const h = await fetch(`${API}/api/health`)
const hj = await h.json()
ok('GET /api/health 200', h.status === 200, `runtime=${hj.runtime} db=${hj.db}`)

const p = await fetch(`${API}/api/permits`, { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ permitId: LONG, permitNo: 'TW0592947', workerName: 'ZAKIR HUSSAIN ABDUL QADIR',
    idNumber: '2458147978', profession: 'سائق شاحنة ثقيلة', providerCr: '4-8462574',
    startDate: '2026-11-08', endDate: '2027-02-07' }) })
const pj = await p.json()
ok('POST /api/permits 201', p.status === 201, pj.url)
ok('QR url = PUBLIC_BASE_URL/v/id', pj.url === `https://ajeer-api.vercel.app/v/${LONG}`, pj.url)

const pngRes = await fetch(`${API}/qr/${LONG}.png`)
const png = PNG.sync.read(Buffer.from(await pngRes.arrayBuffer()))
ok('GET /qr/:id.png 200 png', pngRes.status === 200 && pngRes.headers.get('content-type') === 'image/png')
const dec = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data
ok('QR decodes', dec === `https://ajeer-api.vercel.app/v/${LONG}`, dec)

const v = await fetch(`${API}/v/${LONG}`, { redirect: 'manual' })
ok('GET /v/:id 302', v.status === 302, v.headers.get('location'))
ok('Location = frontend + same id', v.headers.get('location') === `https://ajeer-qiwa-sa-five.vercel.app/notice-verification/${LONG}`)

const rec = await fetch(`${API}/api/records/${LONG}`)
const rj = await rec.json()
ok('GET /api/records/:id 200 mongo data', rec.status === 200 && rj.workerName === 'ZAKIR HUSSAIN ABDUL QADIR')
ok('unknown id 404', (await fetch(`${API}/v/nope-nope`, { redirect: 'manual' })).status === 404)

srv.close(); await mongo.stop()
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED')
process.exit(fails ? 1 : 0)
