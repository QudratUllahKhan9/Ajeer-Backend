import mongoose from 'mongoose'
import { env } from './env.js'

/**
 * Serverless-safe: har invocation par naya connection nahi khulta.
 * Lambda/function container garam rahe to wahi connection reuse hota hai.
 */
const g = globalThis
if (!g.__ajeerMongo) g.__ajeerMongo = { conn: null, promise: null }

export async function connectDb(uri = env.mongoUri) {
  if (g.__ajeerMongo.conn) return g.__ajeerMongo.conn
  if (!g.__ajeerMongo.promise) {
    mongoose.set('strictQuery', true)
    g.__ajeerMongo.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 15000,
        maxPoolSize: 5,
        bufferCommands: false
      })
      .then((m) => {
        g.__ajeerMongo.conn = m.connection
        return m.connection
      })
      .catch((e) => {
        g.__ajeerMongo.promise = null
        throw e
      })
  }
  return g.__ajeerMongo.promise
}

export const isDbReady = () => mongoose.connection.readyState === 1
