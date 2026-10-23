import express from 'express'
import type { NextFunction, Request, Response } from 'express'
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { existsSync } from 'node:fs'
import { unlink, writeFile } from 'node:fs/promises'
import { networkInterfaces } from 'node:os'
import { join } from 'node:path'
import { db, now, UPLOAD_DIR } from './db.ts'

const PORT = Number(process.env.PORT ?? 8787)
const STAFF_PIN = process.env.STAFF_PIN ?? '1234'
const STAFF_SESSION_MS = 12 * 60 * 60 * 1000
const STAFF_COOKIE = 'ndc_staff'
const LINK_SESSION_MS = 2 * 60 * 60 * 1000
const MAX_VERIFY_FAILURES = 5
const VERIFY_WINDOW_MS = 15 * 60 * 1000
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024
const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'application/pdf': '.pdf',
}
const CASE_STATUSES = ['draft', 'shared', 'considering', 'accepted', 'declined']
const URGENCIES = ['today', 'soon', 'routine', 'monitor']
const PATIENT_ACTIONS = ['interested', 'book', 'callback']

const OPEN_DEDUPE_MS = 30 * 60 * 1000

if (STAFF_PIN === '1234') {
  console.warn('WARNING: using the default staff passcode 1234. Set STAFF_PIN before storing real patient data.')
}

type Row = Record<string, unknown>

const app = express()
app.use(express.json({ limit: '25mb' }))

class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const str = (value: unknown, max = 2000) => (typeof value === 'string' ? value.trim().slice(0, max) : '')
const digits = (value: string) => value.replace(/\D/g, '')

// Persisted so patient links and staff sessions survive a server restart.
function loadSessionSecret(): Buffer {
  const row = db.prepare(`SELECT value FROM settings WHERE key = 'session_secret'`).get() as Row | undefined
  if (row) return Buffer.from(row.value as string, 'base64')
  const secret = randomBytes(32)
  db.prepare(`INSERT INTO settings (key, value) VALUES ('session_secret', ?)`).run(secret.toString('base64'))
  return secret
}
const sessionSecret = loadSessionSecret()

// Failed attempts are stored in SQLite so a restart does not reset the lockout.
function assertNotLockedOut(scope: string, max: number, message: string) {
  const since = Date.now() - VERIFY_WINDOW_MS
  db.prepare('DELETE FROM auth_failures WHERE at < ?').run(since)
  const row = db.prepare('SELECT COUNT(*) AS n FROM auth_failures WHERE scope = ? AND at >= ?').get(scope, since) as Row
  if ((row.n as number) >= max) throw new HttpError(429, message)
}

function recordFailure(scope: string) {
  db.prepare('INSERT INTO auth_failures (scope, at) VALUES (?, ?)').run(scope, Date.now())
}

function clearFailures(scope: string) {
  db.prepare('DELETE FROM auth_failures WHERE scope = ?').run(scope)
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function readCookie(req: Request, name: string): string {
  for (const part of (req.header('cookie') ?? '').split(';')) {
    const [key, ...value] = part.trim().split('=')
    if (key === name) return decodeURIComponent(value.join('='))
  }
  return ''
}

function requireStaff(req: Request, _res: Response, next: NextFunction) {
  const token = readCookie(req, STAFF_COOKIE)
  const session = token
    ? (db.prepare('SELECT expires_at FROM staff_sessions WHERE token = ?').get(token) as Row | undefined)
    : undefined
  if (!session || Date.parse(session.expires_at as string) < Date.now()) {
    return next(new HttpError(401, 'Please unlock the app again'))
  }
  next()
}

function lanAddress(): string | null {
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) return entry.address
    }
  }
  return null
}

// ---------- Case helpers ----------

function loadCase(caseId: string) {
  const row = db
    .prepare(
      `SELECT c.*, p.name AS patient_name, p.phone AS patient_phone, p.age AS patient_age, p.language
       FROM cases c JOIN patients p ON p.id = c.patient_id WHERE c.id = ?`,
    )
    .get(caseId) as Row | undefined
  if (!row) throw new HttpError(404, 'Case not found')

  const options = db
    .prepare('SELECT * FROM case_options WHERE case_id = ? ORDER BY position')
    .all(caseId) as Row[]
  const attachments = db
    .prepare('SELECT * FROM attachments WHERE case_id = ? ORDER BY created_at')
    .all(caseId) as Row[]
  const links = db
    .prepare('SELECT * FROM share_links WHERE case_id = ? ORDER BY created_at DESC')
    .all(caseId) as Row[]
  const events = db
    .prepare(
      `SELECT e.event, e.at FROM link_events e JOIN share_links l ON l.token = e.token
       WHERE l.case_id = ? ORDER BY e.at DESC LIMIT 50`,
    )
    .all(caseId) as Row[]

  return {
    id: row.id,
    patient: { name: row.patient_name, phone: row.patient_phone, age: row.patient_age, language: row.language },
    complaint: row.complaint,
    teeth: row.teeth,
    finding: row.finding,
    urgency: row.urgency,
    treatmentId: row.treatment_id,
    dentistName: row.dentist_name,
    dentistNote: row.dentist_note,
    status: row.status,
    followupDate: row.followup_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    options: options.map((o) => ({
      optionId: o.option_id,
      suitable: o.suitable === 1,
      reason: o.reason,
      note: o.note,
      price: o.price,
    })),
    attachments: attachments.map((a) => ({
      id: a.id,
      kind: a.kind,
      caption: a.caption,
      fileName: a.file_name,
      mime: a.mime,
      size: a.size,
      createdAt: a.created_at,
    })),
    links: links.map((l) => ({
      token: l.token,
      expiresAt: l.expires_at,
      revoked: l.revoked === 1,
      createdAt: l.created_at,
    })),
    events,
  }
}

function writeCase(caseId: string, body: Row) {
  const patient = (body.patient ?? {}) as Row
  const name = str(patient.name, 120)
  const phone = digits(str(patient.phone, 20))
  const treatmentId = str(body.treatmentId, 60)
  if (!name) throw new HttpError(400, 'Patient name is required')
  if (phone.length < 10) throw new HttpError(400, 'A 10-digit phone number is required')
  if (!treatmentId) throw new HttpError(400, 'Choose a treatment')

  const urgency = URGENCIES.includes(str(body.urgency)) ? str(body.urgency) : 'routine'
  const status = CASE_STATUSES.includes(str(body.status)) ? str(body.status) : 'draft'
  const age = Number.isInteger(patient.age) ? (patient.age as number) : null
  const options = Array.isArray(body.options) ? (body.options as Row[]) : []
  const timestamp = now()

  db.exec('BEGIN')
  try {
    const existing = db.prepare('SELECT patient_id FROM cases WHERE id = ?').get(caseId) as Row | undefined
    const patientId = (existing?.patient_id as string | undefined) ?? randomUUID()

    if (existing) {
      db.prepare('UPDATE patients SET name = ?, phone = ?, age = ?, language = ? WHERE id = ?').run(
        name,
        phone,
        age,
        str(patient.language, 10) || 'en',
        patientId,
      )
    } else {
      db.prepare('INSERT INTO patients (id, name, phone, age, language, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
        patientId,
        name,
        phone,
        age,
        str(patient.language, 10) || 'en',
        timestamp,
      )
    }

    const fields = [
      str(body.complaint, 200),
      str(body.teeth, 200),
      str(body.finding),
      urgency,
      treatmentId,
      str(body.dentistName, 120),
      str(body.dentistNote),
      status,
      str(body.followupDate, 10) || null,
    ]
    if (existing) {
      db.prepare(
        `UPDATE cases SET complaint = ?, teeth = ?, finding = ?, urgency = ?, treatment_id = ?, dentist_name = ?,
         dentist_note = ?, status = ?, followup_date = ?, updated_at = ? WHERE id = ?`,
      ).run(...fields, timestamp, caseId)
    } else {
      db.prepare(
        `INSERT INTO cases (complaint, teeth, finding, urgency, treatment_id, dentist_name, dentist_note, status,
         followup_date, id, patient_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(...fields, caseId, patientId, timestamp, timestamp)
    }

    db.prepare('DELETE FROM case_options WHERE case_id = ?').run(caseId)
    const insertOption = db.prepare(
      'INSERT INTO case_options (case_id, option_id, suitable, reason, note, price, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    options.forEach((option, index) => {
      const optionId = str(option.optionId, 60)
      const price = Number(option.price)
      if (!optionId || !Number.isFinite(price) || price < 0) return
      insertOption.run(
        caseId,
        optionId,
        option.suitable === false ? 0 : 1,
        str(option.reason, 300),
        str(option.note, 600),
        Math.round(price),
        index,
      )
    })
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

// ---------- Staff API ----------

const auth = express.Router()

auth.post('/login', (req, res) => {
  const scope = `staff:${req.ip}`
  assertNotLockedOut(scope, 10, 'Too many wrong passcodes. Wait 15 minutes and try again.')
  if (!safeEqual(str((req.body as Row).pin, 20), STAFF_PIN)) {
    recordFailure(scope)
    throw new HttpError(403, 'Wrong passcode')
  }
  clearFailures(scope)
  const token = randomBytes(32).toString('base64url')
  db.prepare('DELETE FROM staff_sessions WHERE expires_at < ?').run(now())
  db.prepare('INSERT INTO staff_sessions (token, expires_at) VALUES (?, ?)').run(
    token,
    new Date(Date.now() + STAFF_SESSION_MS).toISOString(),
  )
  res.cookie(STAFF_COOKIE, token, { httpOnly: true, sameSite: 'strict', maxAge: STAFF_SESSION_MS, path: '/api' })
  res.json({ ok: true })
})

auth.post('/logout', (req, res) => {
  db.prepare('DELETE FROM staff_sessions WHERE token = ?').run(readCookie(req, STAFF_COOKIE))
  res.clearCookie(STAFF_COOKIE, { path: '/api' })
  res.status(204).end()
})

auth.get('/session', requireStaff, (_req, res) => {
  res.json({ ok: true })
})

const staff = express.Router()
staff.use(requireStaff)

staff.get('/network', (_req, res) => {
  res.json({ lanAddress: lanAddress() })
})

staff.get('/cases', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.id, c.complaint, c.treatment_id, c.urgency, c.status, c.followup_date, c.updated_at,
         p.name AS patient_name, p.phone AS patient_phone,
         (SELECT COUNT(*) FROM link_events e JOIN share_links l ON l.token = e.token
            WHERE l.case_id = c.id AND e.event = 'opened') AS opens,
         (SELECT e.event FROM link_events e JOIN share_links l ON l.token = e.token
            WHERE l.case_id = c.id AND e.event IN ('interested', 'book', 'callback')
            ORDER BY e.at DESC LIMIT 1) AS last_request
       FROM cases c JOIN patients p ON p.id = c.patient_id
       ORDER BY c.updated_at DESC`,
    )
    .all() as Row[]
  res.json(
    rows.map((r) => ({
      id: r.id,
      patientName: r.patient_name,
      patientPhone: r.patient_phone,
      complaint: r.complaint,
      treatmentId: r.treatment_id,
      urgency: r.urgency,
      status: r.status,
      followupDate: r.followup_date,
      updatedAt: r.updated_at,
      opens: r.opens,
      lastRequest: r.last_request,
    })),
  )
})

staff.post('/cases', (req, res) => {
  const caseId = randomUUID()
  writeCase(caseId, req.body as Row)
  res.status(201).json(loadCase(caseId))
})

staff.get('/cases/:id', (req, res) => {
  res.json(loadCase(req.params.id))
})

staff.put('/cases/:id', (req, res) => {
  loadCase(req.params.id)
  writeCase(req.params.id, req.body as Row)
  res.json(loadCase(req.params.id))
})

staff.delete('/cases/:id', async (req, res) => {
  const files = db.prepare('SELECT stored_name FROM attachments WHERE case_id = ?').all(req.params.id) as Row[]
  const owner = db.prepare('SELECT patient_id FROM cases WHERE id = ?').get(req.params.id) as Row | undefined
  db.prepare('DELETE FROM cases WHERE id = ?').run(req.params.id)
  if (owner) {
    db.prepare('DELETE FROM patients WHERE id = ? AND NOT EXISTS (SELECT 1 FROM cases WHERE patient_id = ?)').run(
      owner.patient_id as string,
      owner.patient_id as string,
    )
  }
  await Promise.all(files.map((f) => unlink(join(UPLOAD_DIR, f.stored_name as string)).catch(() => {})))
  res.status(204).end()
})

staff.post('/cases/:id/attachments', async (req, res) => {
  loadCase(req.params.id)
  const body = req.body as Row
  const mime = str(body.mime, 60)
  const extension = ALLOWED_MIME[mime]
  if (!extension) throw new HttpError(400, 'Only JPG, PNG, WEBP, HEIC or PDF files are allowed')
  const buffer = Buffer.from(str(body.data, 30_000_000), 'base64')
  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) throw new HttpError(400, 'File must be under 15 MB')

  const id = randomUUID()
  const storedName = `${id}${extension}`
  await writeFile(join(UPLOAD_DIR, storedName), buffer)
  db.prepare(
    `INSERT INTO attachments (id, case_id, kind, caption, file_name, stored_name, mime, size, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    req.params.id,
    str(body.kind, 30) || 'photo',
    str(body.caption, 200),
    str(body.fileName, 200) || `attachment${extension}`,
    storedName,
    mime,
    buffer.length,
    now(),
  )
  res.status(201).json(loadCase(req.params.id))
})

staff.delete('/cases/:id/attachments/:attachmentId', async (req, res) => {
  const row = db
    .prepare('SELECT stored_name FROM attachments WHERE id = ? AND case_id = ?')
    .get(req.params.attachmentId, req.params.id) as Row | undefined
  if (!row) throw new HttpError(404, 'Attachment not found')
  db.prepare('DELETE FROM attachments WHERE id = ?').run(req.params.attachmentId)
  await unlink(join(UPLOAD_DIR, row.stored_name as string)).catch(() => {})
  res.json(loadCase(req.params.id))
})

staff.get('/cases/:id/attachments/:attachmentId/file', (req, res) => {
  sendAttachment(res, req.params.id, req.params.attachmentId)
})

staff.post('/cases/:id/links', (req, res) => {
  loadCase(req.params.id)
  const days = Math.min(90, Math.max(1, Number((req.body as Row).days) || 30))
  const token = randomBytes(24).toString('base64url')
  const timestamp = now()
  db.prepare('INSERT INTO share_links (token, case_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
    token,
    req.params.id,
    new Date(Date.now() + days * 86_400_000).toISOString(),
    timestamp,
  )
  db.prepare(`UPDATE cases SET status = 'shared', updated_at = ? WHERE id = ? AND status = 'draft'`).run(
    timestamp,
    req.params.id,
  )
  res.status(201).json(loadCase(req.params.id))
})

staff.post('/cases/:id/links/:token/revoke', (req, res) => {
  db.prepare('UPDATE share_links SET revoked = 1 WHERE token = ? AND case_id = ?').run(req.params.token, req.params.id)
  res.json(loadCase(req.params.id))
})

// ---------- Public (patient) API ----------

function activeLink(token: string) {
  const link = db.prepare('SELECT * FROM share_links WHERE token = ?').get(token) as Row | undefined
  if (!link || link.revoked === 1) throw new HttpError(404, 'This link is no longer available')
  if (Date.parse(link.expires_at as string) < Date.now()) throw new HttpError(410, 'This link has expired')
  return link
}

function logEvent(token: string, event: string) {
  db.prepare('INSERT INTO link_events (token, event, at) VALUES (?, ?, ?)').run(token, event, now())
}

function signSession(token: string, expires: number) {
  return createHmac('sha256', sessionSecret).update(`${token}.${expires}`).digest('base64url')
}

function requirePatientSession(token: string, key: unknown) {
  const [expiresRaw, signature] = typeof key === 'string' ? key.split('.') : []
  const expires = Number(expiresRaw)
  if (!signature || !Number.isFinite(expires) || expires < Date.now()) {
    throw new HttpError(401, 'Please verify again')
  }
  if (!safeEqual(signSession(token, expires), signature)) {
    throw new HttpError(401, 'Please verify again')
  }
}

function sendAttachment(res: Response, caseId: string, attachmentId: string) {
  const row = db
    .prepare('SELECT stored_name, mime, file_name FROM attachments WHERE id = ? AND case_id = ?')
    .get(attachmentId, caseId) as Row | undefined
  const path = row && join(UPLOAD_DIR, row.stored_name as string)
  if (!row || !path || !existsSync(path)) throw new HttpError(404, 'File not found')
  res.setHeader('Content-Type', row.mime as string)
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(row.file_name as string)}`)
  res.sendFile(path)
}

const publicApi = express.Router()

// Before verification only the link's validity is revealed: no names, dates or phone hints.
publicApi.get('/:token', (req, res) => {
  const link = activeLink(req.params.token)
  res.json({ expiresAt: link.expires_at })
})

function publicCase(caseId: string, expiresAt: string) {
  const data = loadCase(caseId)
  const { patient, links: _links, events: _events, ...rest } = data
  return {
    ...rest,
    patient: { firstName: String(patient.name).split(' ')[0], language: patient.language },
    expiresAt,
  }
}

function logOpen(token: string) {
  const last = db
    .prepare(`SELECT at FROM link_events WHERE token = ? AND event = 'opened' ORDER BY at DESC LIMIT 1`)
    .get(token) as Row | undefined
  if (!last || Date.now() - Date.parse(last.at as string) > OPEN_DEDUPE_MS) logEvent(token, 'opened')
}

publicApi.post('/:token/verify', (req, res) => {
  const link = activeLink(req.params.token)
  const scope = `link:${req.params.token}`
  assertNotLockedOut(scope, MAX_VERIFY_FAILURES, 'Too many attempts. Please try again in 15 minutes or call the clinic.')

  const data = loadCase(link.case_id as string)
  const entered = digits(str((req.body as Row).phoneLast4, 10))
  if (entered.length !== 4 || !String(data.patient.phone).endsWith(entered)) {
    recordFailure(scope)
    logEvent(req.params.token, 'verify_failed')
    throw new HttpError(403, 'Those digits do not match the phone number on file')
  }

  clearFailures(scope)
  logEvent(req.params.token, 'verified')
  logOpen(req.params.token)
  const expires = Date.now() + LINK_SESSION_MS
  const key = `${expires}.${signSession(req.params.token, expires)}`
  res.json({ key, case: publicCase(link.case_id as string, link.expires_at as string) })
})

// Re-checks the link on every load so revoked links and edited findings or prices take effect immediately.
publicApi.post('/:token/case', (req, res) => {
  const link = activeLink(req.params.token)
  requirePatientSession(req.params.token, (req.body as Row).key)
  logOpen(req.params.token)
  res.json(publicCase(link.case_id as string, link.expires_at as string))
})

publicApi.get('/:token/files/:attachmentId', (req, res) => {
  const link = activeLink(req.params.token)
  requirePatientSession(req.params.token, req.query.key)
  sendAttachment(res, link.case_id as string, req.params.attachmentId)
})

publicApi.post('/:token/actions', (req, res) => {
  const link = activeLink(req.params.token)
  requirePatientSession(req.params.token, (req.body as Row).key)
  const action = str((req.body as Row).action, 20)
  if (!PATIENT_ACTIONS.includes(action)) throw new HttpError(400, 'Unknown action')
  logEvent(req.params.token, action)
  db.prepare(
    `UPDATE cases SET status = 'considering', updated_at = ? WHERE id = ? AND status IN ('draft', 'shared')`,
  ).run(now(), link.case_id as string)
  res.json({ ok: true })
})

app.use('/api/auth', auth)
app.use('/api/staff', staff)
app.use('/api/public', publicApi)

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message })
    return
  }
  console.error(error)
  res.status(500).json({ error: 'Something went wrong on the clinic server' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Clinic API on http://localhost:${PORT} (LAN: ${lanAddress() ?? 'unavailable'})`)
})
