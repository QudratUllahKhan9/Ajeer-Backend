/**
 * Vercel entry point.
 * Vercel detects a default-exported Express app (index.js at project root) and
 * routes EVERY request to it, keeping the original path intact — is liye
 * /v/:id, /qr/:id.png, /api/* sab waise hi chalte hain jaise local par.
 * Yahan koi app.listen nahi — serverless function handle karta hai.
 */
export { default } from './src/app.js'
