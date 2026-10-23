import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ATTACHMENT_LABELS, STATUS_LABELS, URGENCY_LABELS, staffApi } from '../api/client'
import type { AttachmentKind, CaseInput, CaseRecord, CaseStatus, Urgency } from '../api/client'
import { CLINIC_NAME } from '../config/appConfig'
import { getTreatment, treatments } from '../data/treatments'
import { formatPrice } from '../utils/formatPrice'
import { getEffectivePrice } from '../utils/pricing'
import '../styles/consult.css'

const COMPLAINTS: { label: string; treatmentId: string }[] = [
  { label: 'Tooth pain', treatmentId: 'rootcanal' },
  { label: 'Swelling', treatmentId: 'rootcanal' },
  { label: 'Broken tooth', treatmentId: 'rootcanal' },
  { label: 'Missing tooth', treatmentId: 'implants' },
  { label: 'Crooked teeth', treatmentId: 'aligners' },
  { label: 'Gaps between teeth', treatmentId: 'aligners' },
]

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'Hindi' },
  { id: 'te', label: 'Telugu' },
  { id: 'kn', label: 'Kannada' },
  { id: 'ta', label: 'Tamil' },
]

function optionsFor(treatmentId: string) {
  return (getTreatment(treatmentId)?.options ?? []).map((option) => ({
    optionId: option.id,
    suitable: true,
    reason: '',
    note: '',
    price: getEffectivePrice(treatmentId, option.id, option.price),
  }))
}

function blankCase(): CaseInput {
  const treatmentId = treatments[0].id
  return {
    patient: { name: '', phone: '', age: null, language: 'en' },
    complaint: '',
    teeth: '',
    finding: '',
    urgency: 'routine',
    treatmentId,
    dentistName: '',
    dentistNote: '',
    status: 'draft',
    followupDate: null,
    options: optionsFor(treatmentId),
  }
}

function toInput(record: CaseRecord): CaseInput {
  const { id: _id, createdAt: _c, updatedAt: _u, attachments: _a, links: _l, events: _e, ...input } = record
  return input
}

export function ConsultPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<CaseInput>(blankCase)
  const [record, setRecord] = useState<CaseRecord | null>(null)
  const [loading, setLoading] = useState(Boolean(caseId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState('')

  useEffect(() => {
    if (!caseId) return
    staffApi
      .getCase(caseId)
      .then((data) => {
        setRecord(data)
        setForm(toInput(data))
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [caseId])

  function update<K extends keyof CaseInput>(key: K, value: CaseInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updatePatient<K extends keyof CaseInput['patient']>(key: K, value: CaseInput['patient'][K]) {
    setForm((current) => ({ ...current, patient: { ...current.patient, [key]: value } }))
  }

  function chooseTreatment(treatmentId: string) {
    setForm((current) =>
      current.treatmentId === treatmentId ? current : { ...current, treatmentId, options: optionsFor(treatmentId) },
    )
  }

  function chooseComplaint(label: string, treatmentId: string) {
    update('complaint', label)
    if (!record) chooseTreatment(treatmentId)
  }

  function updateOption(optionId: string, patch: Partial<CaseInput['options'][number]>) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option) => (option.optionId === optionId ? { ...option, ...patch } : option)),
    }))
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const saved = record ? await staffApi.updateCase(record.id, form) : await staffApi.createCase(form)
      setRecord(saved)
      setForm(toInput(saved))
      setSavedAt(new Date().toLocaleTimeString())
      if (!record) navigate(`/cases/${saved.id}`, { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // Server-side changes (new link, uploads) can move the status, e.g. draft → shared. Keep the form in step
  // without discarding unsaved edits, so the next save does not silently revert it.
  function applyServerRecord(next: CaseRecord) {
    setRecord(next)
    setForm((current) => ({ ...current, status: next.status }))
  }

  async function remove() {
    if (!record || !window.confirm('Delete this case, its attachments and all shared links? This cannot be undone.')) {
      return
    }
    await staffApi.deleteCase(record.id)
    navigate('/cases')
  }

  if (loading) return <main className="page muted">Loading case…</main>

  const treatment = getTreatment(form.treatmentId)
  const suitable = form.options.filter((option) => option.suitable)

  return (
    <main className="page consult-page">
      <div className="breadcrumbs">
        <Link to="/cases">Cases</Link> / {record ? form.patient.name : 'New consult'}
      </div>
      <div className="board-head">
        <div>
          <span className="eyebrow">{record ? STATUS_LABELS[record.status] : 'New consult'}</span>
          <h1 className="headline">{record ? form.patient.name : 'Start a consult'}</h1>
        </div>
        {record && (
          <Link className="btn-secondary" to={`/treatment/${form.treatmentId}`}>
            Explain in 3D
          </Link>
        )}
      </div>

      <form className="consult-form" onSubmit={save}>
        <section className="form-card">
          <h2>
            <span className="step">1</span> Patient & complaint
          </h2>
          <div className="field-grid">
            <label className="field">
              <span>Full name</span>
              <input
                className="field-input"
                required
                value={form.patient.name}
                onChange={(event) => updatePatient('name', event.target.value)}
              />
            </label>
            <label className="field">
              <span>Mobile (WhatsApp)</span>
              <input
                className="field-input"
                required
                inputMode="tel"
                pattern="[0-9 +\-]{10,15}"
                value={form.patient.phone}
                onChange={(event) => updatePatient('phone', event.target.value)}
              />
            </label>
            <label className="field">
              <span>Age</span>
              <input
                className="field-input"
                type="number"
                min={0}
                max={120}
                value={form.patient.age ?? ''}
                onChange={(event) =>
                  updatePatient('age', event.target.value === '' ? null : Math.round(Number(event.target.value)))
                }
              />
            </label>
            <label className="field">
              <span>Preferred language</span>
              <select
                className="field-input"
                value={form.patient.language}
                onChange={(event) => updatePatient('language', event.target.value)}
              >
                {LANGUAGES.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="field">
            <span>Why are they here?</span>
            <div className="chips">
              {COMPLAINTS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`chip${form.complaint === item.label ? ' active' : ''}`}
                  onClick={() => chooseComplaint(item.label, item.treatmentId)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <input
              className="field-input"
              placeholder="Or describe in their words"
              value={form.complaint}
              onChange={(event) => update('complaint', event.target.value)}
            />
          </div>
        </section>

        <section className="form-card">
          <h2>
            <span className="step">2</span> Findings
          </h2>
          <div className="field-grid">
            <label className="field">
              <span>Tooth / area (FDI)</span>
              <input
                className="field-input"
                placeholder="e.g. 36, upper front"
                value={form.teeth}
                onChange={(event) => update('teeth', event.target.value)}
              />
            </label>
            <label className="field">
              <span>Dentist</span>
              <input
                className="field-input"
                placeholder="Dr. Nandini"
                value={form.dentistName}
                onChange={(event) => update('dentistName', event.target.value)}
              />
            </label>
          </div>
          <label className="field">
            <span>What you found (patient will read this)</span>
            <textarea
              className="field-input"
              rows={3}
              placeholder="Deep decay has reached the nerve of the lower left back tooth. The X-ray shows early infection at the root tip."
              value={form.finding}
              onChange={(event) => update('finding', event.target.value)}
            />
          </label>
          <div className="field">
            <span>Urgency</span>
            <div className="segmented">
              {(Object.keys(URGENCY_LABELS) as Urgency[]).map((urgency) => (
                <button
                  key={urgency}
                  type="button"
                  className={form.urgency === urgency ? 'active' : ''}
                  onClick={() => update('urgency', urgency)}
                >
                  {URGENCY_LABELS[urgency]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="form-card">
          <h2>
            <span className="step">3</span> Options for this patient
          </h2>
          <div className="field">
            <span>Treatment</span>
            <div className="segmented">
              {treatments.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={form.treatmentId === item.id ? 'active' : ''}
                  onClick={() => chooseTreatment(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          <div className="option-editor-list">
            {form.options.map((option) => {
              const info = treatment?.options.find((item) => item.id === option.optionId)
              return (
                <div key={option.optionId} className={`option-editor${option.suitable ? '' : ' unsuitable'}`}>
                  <div className="option-editor-head">
                    <strong>{info?.name ?? option.optionId}</strong>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={option.suitable}
                        onChange={(event) => updateOption(option.optionId, { suitable: event.target.checked })}
                      />
                      <span>{option.suitable ? 'Suitable' : 'Not suitable'}</span>
                    </label>
                  </div>
                  {option.suitable ? (
                    <div className="field-grid">
                      <label className="field">
                        <span>Price for this patient (₹)</span>
                        <input
                          className="field-input"
                          type="number"
                          min={0}
                          step={500}
                          value={option.price}
                          onChange={(event) => updateOption(option.optionId, { price: Number(event.target.value) })}
                        />
                      </label>
                      <label className="field">
                        <span>Doctor’s note on this option</span>
                        <input
                          className="field-input"
                          placeholder="Good choice if you want fewer visits"
                          value={option.note}
                          onChange={(event) => updateOption(option.optionId, { note: event.target.value })}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="field">
                      <span>Why not (shown gently to patient)</span>
                      <input
                        className="field-input"
                        placeholder="The infection needs medicine between visits"
                        value={option.reason}
                        onChange={(event) => updateOption(option.optionId, { reason: event.target.value })}
                      />
                    </label>
                  )}
                </div>
              )
            })}
          </div>
          {suitable.length === 0 && <p className="form-error">Mark at least one option as suitable.</p>}
          <label className="field">
            <span>Overall message from the doctor</span>
            <textarea
              className="field-input"
              rows={2}
              placeholder="Saving the tooth is possible. Please decide within a week so the infection does not spread."
              value={form.dentistNote}
              onChange={(event) => update('dentistNote', event.target.value)}
            />
          </label>
        </section>

        <section className="form-card">
          <h2>
            <span className="step">4</span> Outcome & follow-up
          </h2>
          <div className="field-grid">
            <label className="field">
              <span>Status</span>
              <select
                className="field-input"
                value={form.status}
                onChange={(event) => update('status', event.target.value as CaseStatus)}
              >
                {(Object.keys(STATUS_LABELS) as CaseStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Follow up on</span>
              <input
                className="field-input"
                type="date"
                value={form.followupDate ?? ''}
                onChange={(event) => update('followupDate', event.target.value || null)}
              />
            </label>
          </div>
        </section>

        <div className="form-actions">
          {error && <p className="form-error">{error}</p>}
          {savedAt && !error && <span className="muted">Saved {savedAt}</span>}
          {record && (
            <button type="button" className="btn-link danger" onClick={remove}>
              Delete case
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={saving || suitable.length === 0}>
            {saving ? 'Saving…' : record ? 'Save changes' : 'Save & continue'}
          </button>
        </div>
      </form>

      {record ? (
        <>
          <AttachmentsSection record={record} onChange={applyServerRecord} />
          <ShareSection record={record} onChange={applyServerRecord} />
        </>
      ) : (
        <p className="muted locked-note">Save the consult to add X-rays and photos and send the case link.</p>
      )}
    </main>
  )
}

function AttachmentsSection({ record, onChange }: { record: CaseRecord; onChange: (next: CaseRecord) => void }) {
  const [kind, setKind] = useState<AttachmentKind>('xray')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    setError('')
    try {
      let latest = record
      for (const file of Array.from(files)) {
        latest = await staffApi.uploadAttachment(record.id, file, kind, caption)
      }
      onChange(latest)
      setCaption('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="form-card">
      <h2>
        <span className="step">5</span> X-rays, photos & documents
      </h2>
      <div className="field-grid">
        <label className="field">
          <span>Type</span>
          <select
            className="field-input"
            value={kind}
            onChange={(event) => setKind(event.target.value as AttachmentKind)}
          >
            {(Object.keys(ATTACHMENT_LABELS) as AttachmentKind[]).map((item) => (
              <option key={item} value={item}>
                {ATTACHMENT_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Caption for patient</span>
          <input
            className="field-input"
            placeholder="Dark area at root tip = infection"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
          />
        </label>
      </div>
      <label className={`upload-drop${busy ? ' busy' : ''}`}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
          multiple
          disabled={busy}
          onChange={(event) => {
            void upload(event.target.files)
            event.target.value = ''
          }}
        />
        {busy ? 'Uploading…' : 'Take photo or choose files (JPG, PNG, PDF · max 15 MB)'}
      </label>
      {error && <p className="form-error">{error}</p>}
      <ul className="attachment-grid">
        {record.attachments.map((attachment) => {
          const url = staffApi.attachmentUrl(record.id, attachment.id)
          return (
            <li key={attachment.id} className="attachment-tile">
              <a href={url} target="_blank" rel="noreferrer">
                {attachment.mime.startsWith('image/') ? (
                  <img src={url} alt={attachment.caption || attachment.fileName} />
                ) : (
                  <span className="file-icon">PDF</span>
                )}
              </a>
              <div>
                <strong>{ATTACHMENT_LABELS[attachment.kind] ?? attachment.kind}</strong>
                <span className="muted">{attachment.caption || attachment.fileName}</span>
              </div>
              <button
                type="button"
                className="btn-link danger"
                onClick={() => staffApi.deleteAttachment(record.id, attachment.id).then(onChange)}
              >
                Remove
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ShareSection({ record, onChange }: { record: CaseRecord; onChange: (next: CaseRecord) => void }) {
  const [days, setDays] = useState(30)
  const [lanAddress, setLanAddress] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [openedAt] = useState(() => Date.now())

  useEffect(() => {
    staffApi
      .network()
      .then((data) => setLanAddress(data.lanAddress))
      .catch(() => setLanAddress(null))
  }, [])

  const activeLinks = record.links.filter((link) => !link.revoked && Date.parse(link.expiresAt) > openedAt)
  const origin =
    lanAddress && ['localhost', '127.0.0.1'].includes(window.location.hostname)
      ? `${window.location.protocol}//${lanAddress}:${window.location.port}`
      : window.location.origin

  function linkUrl(token: string) {
    return `${origin}/c/${token}`
  }

  function whatsappUrl(token: string, expiresAt: string) {
    const phone = record.patient.phone.replace(/\D/g, '').slice(-10)
    const firstName = record.patient.name.split(' ')[0]
    const message = [
      `Hello ${firstName}, this is ${CLINIC_NAME}.`,
      `Here is your personal treatment summary from your visit — your X-rays, the options we discussed, costs and answers to common questions:`,
      linkUrl(token),
      `To open it, enter the last 4 digits of this phone number. The link is valid until ${new Date(expiresAt).toLocaleDateString('en-IN')}.`,
      `Share it with family if you like, and reply here with any questions.`,
    ].join('\n\n')
    return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`
  }

  async function create() {
    setError('')
    try {
      onChange(await staffApi.createLink(record.id, days))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(linkUrl(token))
      setCopied(token)
    } catch {
      setError('Copy failed. Select the link and copy it manually.')
    }
  }

  return (
    <section className="form-card">
      <h2>
        <span className="step">6</span> Send the case link
      </h2>
      <p className="muted">
        The patient gets one page with their findings, attachments, treatment stages in 3D, option comparison, costs
        and FAQs. They unlock it with the last 4 digits of their phone.
      </p>
      {!lanAddress && (
        <p className="form-warning">
          No network address found. Links will only open on this device until it is connected to the clinic Wi-Fi.
        </p>
      )}
      <div className="share-create">
        <label className="field">
          <span>Valid for</span>
          <select className="field-input" value={days} onChange={(event) => setDays(Number(event.target.value))}>
            {[7, 14, 30, 60, 90].map((value) => (
              <option key={value} value={value}>
                {value} days
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-primary" onClick={create}>
          Create link
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}

      <ul className="link-list">
        {activeLinks.map((link) => (
          <li key={link.token} className="link-row">
            <code>{linkUrl(link.token)}</code>
            <span className="muted">Valid until {new Date(link.expiresAt).toLocaleDateString('en-IN')}</span>
            <div className="link-actions">
              <a className="btn-whatsapp" href={whatsappUrl(link.token, link.expiresAt)} target="_blank" rel="noreferrer">
                Send on WhatsApp
              </a>
              <a className="btn-secondary" href={`/c/${link.token}`} target="_blank" rel="noreferrer">
                Preview
              </a>
              <button type="button" className="btn-secondary" onClick={() => copy(link.token)}>
                {copied === link.token ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                className="btn-link danger"
                onClick={() => staffApi.revokeLink(record.id, link.token).then(onChange)}
              >
                Revoke
              </button>
            </div>
          </li>
        ))}
      </ul>

      {record.events.length > 0 && (
        <div className="activity">
          <h3>Patient activity</h3>
          <ul>
            {record.events.slice(0, 10).map((event, index) => (
              <li key={`${event.at}-${index}`}>
                <span>{EVENT_LABELS[event.event] ?? event.event}</span>
                <span className="muted">{new Date(event.at).toLocaleString('en-IN')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="muted small">
        Prices on the patient’s page:{' '}
        {record.options
          .filter((option) => option.suitable)
          .map((option) => formatPrice(option.price))
          .join(' / ')}
      </p>
    </section>
  )
}

const EVENT_LABELS: Record<string, string> = {
  opened: 'Opened link',
  verified: 'Unlocked case',
  verify_failed: 'Wrong digits entered',
  interested: 'Tapped “I’m interested”',
  book: 'Asked to book',
  callback: 'Asked for a call back',
}
