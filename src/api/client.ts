export type Urgency = 'today' | 'soon' | 'routine' | 'monitor'
export type CaseStatus = 'draft' | 'shared' | 'considering' | 'accepted' | 'declined'
export type AttachmentKind = 'xray' | 'photo' | 'report' | 'prescription' | 'estimate' | 'consent'

export interface CaseOption {
  optionId: string
  suitable: boolean
  reason: string
  note: string
  price: number
}

export interface Attachment {
  id: string
  kind: AttachmentKind
  caption: string
  fileName: string
  mime: string
  size: number
  createdAt: string
}

export interface ShareLink {
  token: string
  expiresAt: string
  revoked: boolean
  createdAt: string
}

export interface CaseInput {
  patient: { name: string; phone: string; age: number | null; language: string }
  complaint: string
  teeth: string
  finding: string
  urgency: Urgency
  treatmentId: string
  dentistName: string
  dentistNote: string
  status: CaseStatus
  followupDate: string | null
  options: CaseOption[]
}

export interface CaseRecord extends CaseInput {
  id: string
  createdAt: string
  updatedAt: string
  attachments: Attachment[]
  links: ShareLink[]
  events: { event: string; at: string }[]
}

export interface CaseSummary {
  id: string
  patientName: string
  patientPhone: string
  complaint: string
  treatmentId: string
  urgency: Urgency
  status: CaseStatus
  followupDate: string | null
  updatedAt: string
  opens: number
  lastRequest: 'interested' | 'book' | 'callback' | null
}

export interface PublicCaseMeta {
  expiresAt: string
}

export type PublicCase = Omit<CaseRecord, 'patient' | 'links' | 'events'> & {
  patient: { firstName: string; language: string }
  expiresAt: string
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Fired when the staff session cookie is missing or expired so the app can return to the lock screen. */
export const STAFF_UNAUTHORIZED_EVENT = 'staff-unauthorized'

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('content-type', 'application/json')

  let response: Response
  try {
    response = await fetch(`/api${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, 'Cannot reach the clinic server. Is it running?')
  }
  if (response.status === 204) return undefined as T
  const body: unknown = await response.json().catch(() => null)
  if (response.status === 401 && path.startsWith('/staff/')) {
    window.dispatchEvent(new Event(STAFF_UNAUTHORIZED_EVENT))
  }
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body ? String(body.error) : `Request failed (${response.status})`
    throw new ApiError(response.status, message)
  }
  return body as T
}

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

export const authApi = {
  login: (pin: string) => request<{ ok: true }>('/auth/login', json('POST', { pin })),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
}

export const staffApi = {
  network: () => request<{ lanAddress: string | null }>('/staff/network'),
  listCases: () => request<CaseSummary[]>('/staff/cases'),
  getCase: (id: string) => request<CaseRecord>(`/staff/cases/${id}`),
  createCase: (input: CaseInput) => request<CaseRecord>('/staff/cases', json('POST', input)),
  updateCase: (id: string, input: CaseInput) => request<CaseRecord>(`/staff/cases/${id}`, json('PUT', input)),
  deleteCase: (id: string) => request<void>(`/staff/cases/${id}`, { method: 'DELETE' }),
  uploadAttachment: (id: string, file: File, kind: AttachmentKind, caption: string) =>
    fileToBase64(file).then((data) =>
      request<CaseRecord>(
        `/staff/cases/${id}/attachments`,
        json('POST', { data, kind, caption, mime: file.type, fileName: file.name }),
      ),
    ),
  deleteAttachment: (id: string, attachmentId: string) =>
    request<CaseRecord>(`/staff/cases/${id}/attachments/${attachmentId}`, { method: 'DELETE' }),
  attachmentUrl: (id: string, attachmentId: string) =>
    `/api/staff/cases/${id}/attachments/${attachmentId}/file`,
  createLink: (id: string, days: number) => request<CaseRecord>(`/staff/cases/${id}/links`, json('POST', { days })),
  revokeLink: (id: string, token: string) =>
    request<CaseRecord>(`/staff/cases/${id}/links/${token}/revoke`, { method: 'POST' }),
}

export const publicApi = {
  meta: (token: string) => request<PublicCaseMeta>(`/public/${token}`),
  verify: (token: string, phoneLast4: string) =>
    request<{ key: string; case: PublicCase }>(`/public/${token}/verify`, json('POST', { phoneLast4 })),
  getCase: (token: string, key: string) => request<PublicCase>(`/public/${token}/case`, json('POST', { key })),
  fileUrl: (token: string, attachmentId: string, key: string) =>
    `/api/public/${token}/files/${attachmentId}?key=${encodeURIComponent(key)}`,
  action: (token: string, key: string, action: 'interested' | 'book' | 'callback') =>
    request<{ ok: true }>(`/public/${token}/actions`, json('POST', { key, action })),
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(new ApiError(0, 'Could not read the file'))
    reader.readAsDataURL(file)
  })
}

export const URGENCY_LABELS: Record<Urgency, string> = {
  today: 'Needs care today',
  soon: 'Within a few days',
  routine: 'Routine',
  monitor: 'Monitor',
}

export const STATUS_LABELS: Record<CaseStatus, string> = {
  draft: 'Draft',
  shared: 'Link sent',
  considering: 'Considering',
  accepted: 'Accepted',
  declined: 'Declined',
}

export const ATTACHMENT_LABELS: Record<AttachmentKind, string> = {
  xray: 'X-ray',
  photo: 'Photo',
  report: 'Report',
  prescription: 'Prescription',
  estimate: 'Estimate',
  consent: 'Consent',
}
