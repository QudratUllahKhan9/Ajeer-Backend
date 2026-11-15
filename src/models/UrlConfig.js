import mongoose from 'mongoose'
const historySchema = new mongoose.Schema(
  { publicBaseUrl: String, frontendBaseUrl: String, changedAt: { type: Date, default: Date.now }, note: String },
  { _id: false }
)
const urlConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    publicBaseUrl: { type: String, default: '' },     // api.yourdomain.com
    frontendBaseUrl: { type: String, default: '' },   // ajeer-frontend.vercel.app
    history: { type: [historySchema], default: [] }
  },
  { timestamps: true }
)
export const UrlConfig = mongoose.model('UrlConfig', urlConfigSchema)
