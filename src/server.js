import { env } from './config/env.js'
import { connectDb } from './config/db.js'
import app from './app.js'

/* Local / Render / Railway ke liye. Vercel par listen nahi hota. */
if (!process.env.VERCEL) {
  const start = async () => {
    await connectDb()
    app.listen(env.port, () => console.log(`ajeer backend on :${env.port}  publicBase=${env.publicBaseUrl}`))
  }
  start().catch((e) => { console.error('start failed:', e.message); process.exit(1) })
}

export default app
