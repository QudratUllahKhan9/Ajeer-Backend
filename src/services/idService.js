import crypto from 'node:crypto'

/**
 * Long, unguessable id — jaise:
 * 122111111111bbnbnc121cv12cvc1212cc21vc2v1c2
 * User jo id khud de wo bhi chalti hai (letters/digits/-/_ , 6 se 128 chars).
 */
export const MIN_ID = 6
export const MAX_ID = 128

export function sanitizeId(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')   // sirf safe chars — URL/QR ke liye
    .slice(0, MAX_ID)
}

export function newLongId(len = 44) {
  // base36 → sirf a-z0-9, QR friendly
  let s = crypto.randomBytes(Math.ceil(len * 0.9)).toString('hex')
  // thodi variety: hex + random alnum
  const alnum = 'abcdefghijklmnopqrstuvwxyz0123456789'
  s = Array.from({ length: len }, () => alnum[crypto.randomInt(alnum.length)]).join('')
  return s
}

export function makeId(fromUser, permitNo) {
  const custom = sanitizeId(fromUser)
  if (custom.length >= MIN_ID) return custom
  const fromNo = sanitizeId(permitNo)
  if (fromNo.length >= MIN_ID) return fromNo
  return newLongId()
}
