import 'dotenv/config'
const strip = (v, fb = '') => String(v ?? fb).replace(/\/+$/, '')

export const env = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ajeer',
  adminToken: process.env.ADMIN_TOKEN || 'change-me',

  /* QR host = yeh backend.  QR = <PUBLIC_BASE_URL>/v/<id>  */
  publicBaseUrl: strip(process.env.PUBLIC_BASE_URL, 'http://localhost:4000'),

  /* scan hone par yahan bheja jata hai: <FRONTEND_URL>/v/<id> */
  frontendUrl: strip(process.env.FRONTEND_URL || process.env.FRONTEND_BASE_URL, 'https://ajeer-frontend.vercel.app'),

  /* redirect = 302 to FRONTEND_URL/v/<id> (default)
     page     = backend khud HTML page banata hai                        */
  redirectMode: String(process.env.REDIRECT_MODE || 'redirect').toLowerCase(),

  webOrigins: String(process.env.WEB_ORIGIN || 'http://localhost:5173,https://ajeer-frontend.vercel.app')
    .split(',').map((s) => s.trim()).filter(Boolean)
}
