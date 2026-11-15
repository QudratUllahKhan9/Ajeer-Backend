import mongoose from 'mongoose'

const qrSchema = new mongoose.Schema(
  {
    targetUrl: { type: String, default: '' },       // <FRONTEND_BASE_URL>/v/<permitId>
    imageUrl: { type: String, default: '' },        // <API>/qr/<permitId>.png
    apiRecordUrl: { type: String, default: '' },     // <API>/api/records/<permitId>
    frontendBaseUrl: { type: String, default: '' },
    publicId: { type: String, default: '' },
    baseUrl: { type: String, default: '' },
    generatedAt: { type: Date, default: null }
  },
  { _id: false }
)

const permitSchema = new mongoose.Schema(
  {
    permitId: { type: String, required: true, unique: true, index: true, lowercase: true, maxlength: 128 },
    permitNo: { type: String, default: '', index: true },
    title: { type: String, default: 'تصريح أجير – تعاقد أجير' },
    workerName: { type: String, default: '', index: true },
    idNumber: { type: String, default: '', index: true },
    profession: { type: String, default: '' },
    nationality: { type: String, default: '' },
    birthDate: { type: String, default: '' },
    providerCompany: { type: String, default: '' },
    providerCr: { type: String, default: '' },
    beneficiaryCompany: { type: String, default: '' },
    beneficiaryCr: { type: String, default: '' },
    contractNote: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    workSites: { type: String, default: '' },
    status: { type: String, default: '' },
    qr: { type: qrSchema, default: () => ({}) }
  },
  { timestamps: true, collection: 'permits' }
)

permitSchema.index({ workerName: 'text', permitNo: 'text' })

export const Permit = mongoose.model('Permit', permitSchema)
