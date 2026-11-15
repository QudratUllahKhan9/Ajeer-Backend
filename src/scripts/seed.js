/**
 * Pre-fill MongoDB so the frontend form already has data.
 *   node src/scripts/seed.js            (adds the demo record if missing)
 *   node src/scripts/seed.js --force    (upsert / overwrite)
 */
import { connectDb } from '../config/db.js'
import { Permit } from '../models/Permit.js'
import { buildQr } from '../services/qrService.js'
import mongoose from 'mongoose'

const DEMO = {
  permitId: 'b283254a',
  permitNo: 'TW0592947',
  title: 'تصريح أجير – تعاقد أجير',
  workerName: 'ZAKIR HUSSAIN ABDUL QADIR',
  idNumber: '2458147978',
  profession: 'سائق شاحنة ثقيلة',
  nationality: 'باكستان',
  birthDate: '1993-05-13',
  providerCompany: 'مؤسسة الهدف الاحمر للنقليات',
  providerCr: '4-8462574',
  beneficiaryCompany: 'شركة عبدالله بن حمود الحربي للتجارة',
  beneficiaryCr: '17-8463219',
  contractNote: 'Providing services according to purchase orders 104101',
  startDate: '2026-11-08',
  endDate: '2027-02-07',
  workSites: 'الرياض، حي النور، 82844'
}

const force = process.argv.includes('--force')
await connectDb()

const exists = await Permit.findOne({ permitId: DEMO.permitId }).lean()
if (exists && !force) {
  console.log('already there:', DEMO.permitId, '→', exists.qr?.targetUrl)
} else {
  const qr = await buildQr(DEMO.permitId)
  await Permit.findOneAndUpdate(
    { permitId: DEMO.permitId },
    { $set: { ...DEMO, qr: {
        targetUrl: qr.targetUrl, imageUrl: qr.imageUrl, apiRecordUrl: qr.apiRecordUrl,
        publicId: `qr_${DEMO.permitId}`, baseUrl: qr.frontendBaseUrl,
        frontendBaseUrl: qr.frontendBaseUrl, generatedAt: qr.generatedAt
      } } },
    { upsert: true, new: true }
  )
  console.log('seeded:', DEMO.permitId, '→', qr.targetUrl)
}
await mongoose.disconnect()
