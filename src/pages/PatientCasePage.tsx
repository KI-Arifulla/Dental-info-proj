import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { ATTACHMENT_LABELS, URGENCY_LABELS, publicApi } from '../api/client'
import type { PublicCase, PublicCaseMeta } from '../api/client'
import { CLINIC_NAME } from '../config/appConfig'
import { getOptionGuide, getTreatmentGuide } from '../data/guides'
import { getOptionScene } from '../data/scenes'
import { getTreatment } from '../data/treatments'
import type { Faq, TreatmentOption } from '../data/types'
import { formatPrice } from '../utils/formatPrice'
import '../styles/case.css'

const ModelViewer = lazy(() => import('../three/ModelViewer').then((module) => ({ default: module.ModelViewer })))

const SESSION_KEY = (token: string) => `nandini-case.${token}`

// Only the short-lived access key is kept; case details are always fetched fresh from the server.
function readSavedKey(token: string): string {
  try {
    const key = sessionStorage.getItem(SESSION_KEY(token)) ?? ''
    // The key starts with its expiry timestamp; expired keys ask for the digits again.
    return Number(key.split('.')[0]) > Date.now() ? key : ''
  } catch {
    return ''
  }
}

function forgetKey(token: string) {
  try {
    sessionStorage.removeItem(SESSION_KEY(token))
  } catch {
    // Nothing stored.
  }
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function PatientCasePage() {
  const { token = '' } = useParams()
  const [meta, setMeta] = useState<PublicCaseMeta | null>(null)
  const [session, setSession] = useState<{ key: string; data: PublicCase } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const savedKey = readSavedKey(token)
    publicApi
      .meta(token)
      .then(async (nextMeta) => {
        if (!savedKey) return nextMeta
        try {
          const data = await publicApi.getCase(token, savedKey)
          if (!cancelled) setSession({ key: savedKey, data })
        } catch {
          forgetKey(token)
        }
        return nextMeta
      })
      .then((nextMeta) => {
        if (!cancelled) setMeta(nextMeta)
      })
      .catch((err: Error) => {
        forgetKey(token)
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  function onVerified(key: string, data: PublicCase) {
    setSession({ key, data })
    try {
      sessionStorage.setItem(SESSION_KEY(token), key)
    } catch {
      // The case still renders for this page load.
    }
  }

  if (error) {
    return (
      <div className="case-shell">
        <div className="case-gate">
          <ClinicMark />
          <h1>Link unavailable</h1>
          <p>{error}. Please contact the clinic for a new link.</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="case-shell">
        {meta ? <VerifyGate token={token} meta={meta} onVerified={onVerified} /> : <p className="case-loading">Loading…</p>}
      </div>
    )
  }

  return <CaseReport token={token} sessionKey={session.key} data={session.data} />
}

function ClinicMark() {
  return (
    <div className="case-mark">
      <span className="case-logo" aria-hidden="true">
        N
      </span>
      <span>{CLINIC_NAME}</span>
    </div>
  )
}

function VerifyGate({
  token,
  meta,
  onVerified,
}: {
  token: string
  meta: PublicCaseMeta
  onVerified: (key: string, data: PublicCase) => void
}) {
  const [digits, setDigits] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await publicApi.verify(token, digits)
      onVerified(result.key, result.case)
    } catch (err) {
      setError((err as Error).message)
      setDigits('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="case-gate" onSubmit={submit}>
      <ClinicMark />
      <h1>Your treatment summary</h1>
      <p>Your dentist has shared a personal summary of your visit.</p>
      <label className="gate-label" htmlFor="digits">
        To keep your health details private, enter the last 4 digits of the phone number you gave the clinic
      </label>
      <input
        id="digits"
        className="gate-input"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        pattern="[0-9]{4}"
        required
        value={digits}
        onChange={(event) => setDigits(event.target.value.replace(/\D/g, ''))}
      />
      {error && <p className="gate-error">{error}</p>}
      <button type="submit" className="case-btn primary" disabled={busy || digits.length !== 4}>
        {busy ? 'Checking…' : 'View my summary'}
      </button>
      <p className="gate-foot">Link valid until {formatDate(meta.expiresAt)}</p>
    </form>
  )
}

interface ResolvedOption {
  info: TreatmentOption
  price: number
  note: string
  reason: string
  suitable: boolean
}

function CaseReport({ token, sessionKey, data }: { token: string; sessionKey: string; data: PublicCase }) {
  const treatment = getTreatment(data.treatmentId)
  const guide = getTreatmentGuide(data.treatmentId)

  const options = useMemo<ResolvedOption[]>(
    () =>
      data.options.flatMap((option) => {
        const info = treatment?.options.find((item) => item.id === option.optionId)
        return info ? [{ ...option, info }] : []
      }),
    [data.options, treatment],
  )
  const suitable = options.filter((option) => option.suitable)
  const unsuitable = options.filter((option) => !option.suitable)

  const sections = [
    { id: 'problem', label: 'Your problem' },
    data.attachments.length > 0 && { id: 'files', label: 'X-rays & files' },
    guide && { id: 'untreated', label: 'If untreated' },
    { id: 'treatment', label: 'Treatment' },
    suitable.length > 1 && { id: 'compare', label: 'Compare' },
    { id: 'faq', label: 'Questions' },
  ].filter((section): section is { id: string; label: string } => Boolean(section))

  return (
    <div className="case-shell report">
      <header className="case-header">
        <ClinicMark />
        <div className="case-hero">
          <span className="case-eyebrow">Personal treatment summary</span>
          <h1>
            {data.patient.firstName}, here’s what we found and your options
          </h1>
          <p className="case-sub">
            {formatDate(data.createdAt)}
            {data.dentistName ? ` · ${data.dentistName}` : ''} · Valid until {formatDate(data.expiresAt)}
          </p>
        </div>
        <nav className="case-nav" aria-label="Sections">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="case-main">
        <section id="problem" className="case-section">
          <h2>Your problem</h2>
          <div className={`urgency-banner urgency-${data.urgency}`}>{URGENCY_LABELS[data.urgency]}</div>
          <div className="problem-grid">
            <dl className="problem-facts">
              {data.complaint && (
                <>
                  <dt>You came in with</dt>
                  <dd>{data.complaint}</dd>
                </>
              )}
              {data.teeth && (
                <>
                  <dt>Tooth / area</dt>
                  <dd>{data.teeth}</dd>
                </>
              )}
              {treatment && (
                <>
                  <dt>Treatment discussed</dt>
                  <dd>{treatment.name}</dd>
                </>
              )}
            </dl>
            <div>
              {data.finding && <p className="finding">{data.finding}</p>}
              {guide && <p className="muted-text">{guide.problem}</p>}
              {data.dentistNote && (
                <blockquote className="doctor-note">
                  <p>{data.dentistNote}</p>
                  <cite>{data.dentistName || 'Your dentist'}</cite>
                </blockquote>
              )}
            </div>
          </div>
        </section>

        {data.attachments.length > 0 && (
          <section id="files" className="case-section">
            <h2>Your X-rays & documents</h2>
            <ul className="case-files">
              {data.attachments.map((attachment) => {
                const url = publicApi.fileUrl(token, attachment.id, sessionKey)
                return (
                  <li key={attachment.id}>
                    <a href={url} target="_blank" rel="noreferrer" className="case-file">
                      {attachment.mime.startsWith('image/') ? (
                        <img src={url} alt={attachment.caption || ATTACHMENT_LABELS[attachment.kind]} loading="lazy" />
                      ) : (
                        <span className="case-file-pdf">PDF</span>
                      )}
                      <span className="case-file-label">
                        <strong>{ATTACHMENT_LABELS[attachment.kind] ?? 'File'}</strong>
                        {attachment.caption && <span>{attachment.caption}</span>}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {guide && (
          <section id="untreated" className="case-section">
            <h2>What may happen if it’s left untreated</h2>
            <p className="muted-text">
              Every mouth is different. These are possibilities, not certainties — your dentist can tell you what is
              likely for you.
            </p>
            <ol className="timeline">
              {guide.ifUntreated.map((step) => (
                <li key={step.label}>
                  <strong>{step.label}</strong>
                  <p>{step.description}</p>
                </li>
              ))}
            </ol>
            <div className="warning-box">
              <h3>Contact the clinic promptly if you notice</h3>
              <ul>
                {guide.warningSigns.map((sign) => (
                  <li key={sign}>{sign}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {suitable.length > 0 && <TreatmentSection treatmentId={data.treatmentId} options={suitable} />}

        {suitable.length > 1 && <CompareSection options={suitable} treatmentId={data.treatmentId} />}

        {suitable.length === 1 && <SingleOptionFacts option={suitable[0]} treatmentId={data.treatmentId} />}

        {unsuitable.length > 0 && (
          <section className="case-section">
            <h2>Options that don’t suit your case</h2>
            <ul className="unsuitable-list">
              {unsuitable.map((option) => (
                <li key={option.info.id}>
                  <strong>{option.info.name}</strong>
                  <span>{option.reason || 'Your dentist advised against this for your tooth.'}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {guide && (
          <section className="case-section">
            <h2>Aftercare</h2>
            <ul className="check-list">
              {guide.aftercare.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        <FaqSection
          faqs={[
            ...(guide?.faqs ?? []),
            ...suitable.flatMap((option) => getOptionGuide(data.treatmentId, option.info.id)?.faqs ?? []),
          ]}
        />

        <NextSteps token={token} sessionKey={sessionKey} />

        <p className="case-disclaimer">
          This summary explains the options discussed at your visit. It is not a final quote or a guarantee of
          results. Prices may change if the treatment plan changes. Please ask your dentist about anything unclear.
        </p>
      </main>
    </div>
  )
}

function TreatmentSection({ treatmentId, options }: { treatmentId: string; options: ResolvedOption[] }) {
  const [selected, setSelected] = useState(options[0].info.id)
  const [stageIndex, setStageIndex] = useState(0)
  // Older phones without WebGL get the step list only instead of a blank canvas.
  const [supports3d] = useState(hasWebGL)
  const [show3d, setShow3d] = useState(supports3d)
  const option = options.find((item) => item.info.id === selected) ?? options[0]
  const scene = getOptionScene(treatmentId, option.info.id)
  const stages = scene?.stages ?? []
  const stage = stages[Math.min(stageIndex, stages.length - 1)]

  return (
    <section id="treatment" className="case-section">
      <h2>How the treatment works</h2>
      {options.length > 1 && (
        <div className="case-tabs" role="tablist">
          {options.map((item) => (
            <button
              key={item.info.id}
              type="button"
              role="tab"
              aria-selected={item.info.id === selected}
              className={item.info.id === selected ? 'active' : ''}
              onClick={() => {
                setSelected(item.info.id)
                setStageIndex(0)
              }}
            >
              {item.info.name}
            </button>
          ))}
        </div>
      )}
      <p className="muted-text">{option.info.longDescription}</p>

      {scene && stage && (
        <div className="stage-viewer">
          <div className="stage-canvas">
            {show3d ? (
              <Suspense fallback={<div className="stage-placeholder">Loading 3D view…</div>}>
                <ModelViewer
                  {...option.info.model}
                  scene={scene}
                  stageIndex={stageIndex}
                  reveal={0.6}
                  height="100%"
                />
              </Suspense>
            ) : (
              <div className="stage-placeholder">
                {supports3d ? '3D view is off' : 'This phone can’t show 3D. Follow the steps to see each stage.'}
              </div>
            )}
            {supports3d && (
              <button type="button" className="stage-3d-toggle" onClick={() => setShow3d((value) => !value)}>
                {show3d ? 'Turn off 3D' : 'Show 3D'}
              </button>
            )}
          </div>
          <div className="stage-steps">
            <input
              type="range"
              min={0}
              max={stages.length - 1}
              value={stageIndex}
              aria-label="Treatment stage"
              aria-valuetext={stage.label}
              onChange={(event) => setStageIndex(Number(event.target.value))}
            />
            <ol>
              {stages.map((item, index) => (
                <li key={item.id} className={index === stageIndex ? 'active' : ''}>
                  <button type="button" onClick={() => setStageIndex(index)}>
                    <span className="stage-num">{index + 1}</span>
                    <span>
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  )
}

function longevityText(option: ResolvedOption, treatmentId: string) {
  const facts = getOptionGuide(treatmentId, option.info.id)?.facts
  if (!facts) return '—'
  const { min, max, unit } = facts.longevity
  return `${min}–${max} ${unit}`
}

const FACT_ROWS: { label: string; key: 'visits' | 'duration' | 'comfort' | 'appearance' | 'maintenance' | 'ifItFails' }[] = [
  { label: 'Visits', key: 'visits' },
  { label: 'Total time', key: 'duration' },
  { label: 'Comfort', key: 'comfort' },
  { label: 'Appearance', key: 'appearance' },
  { label: 'Upkeep', key: 'maintenance' },
  { label: 'If a problem happens', key: 'ifItFails' },
]

function CompareSection({ options, treatmentId }: { options: ResolvedOption[]; treatmentId: string }) {
  const lowest = Math.min(...options.map((option) => option.price))
  const longest = Math.max(
    ...options.map((option) => getOptionGuide(treatmentId, option.info.id)?.facts.longevity.max ?? 0),
  )

  return (
    <section id="compare" className="case-section">
      <h2>Compare your options</h2>
      <p className="muted-text">
        Only the options your dentist found suitable for you. How long treatment lasts depends on your habits,
        cleaning and check-ups.
      </p>
      <div className="compare-scroll">
        <div className="compare-cards" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(240px, 1fr))` }}>
          {options.map((option) => {
            const guide = getOptionGuide(treatmentId, option.info.id)
            const difference = option.price - lowest
            return (
              <article key={option.info.id} className="compare-card">
                <header>
                  <div className="compare-tags">
                    {option.price === lowest && <span className="tag">Lowest cost</span>}
                    {guide && guide.facts.longevity.max === longest && <span className="tag">Longest lasting</span>}
                  </div>
                  <h3>{option.info.name}</h3>
                  <p className="compare-price">{formatPrice(option.price)}</p>
                  <p className="compare-diff">
                    {difference === 0 ? 'Base price' : `+${formatPrice(difference)} more than lowest`}
                  </p>
                </header>
                {option.note && <p className="compare-note">“{option.note}”</p>}
                <dl className="compare-facts">
                  <div>
                    <dt>Usually lasts</dt>
                    <dd>
                      {longevityText(option, treatmentId)}
                      {guide?.facts.longevity.note && <small>{guide.facts.longevity.note}</small>}
                    </dd>
                  </div>
                  {guide &&
                    FACT_ROWS.map((row) => (
                      <div key={row.key}>
                        <dt>{row.label}</dt>
                        <dd>{guide.facts[row.key]}</dd>
                      </div>
                    ))}
                </dl>
                <ProsCons option={option.info} />
                {guide && guide.facts.considerations.length > 0 && (
                  <div className="consider">
                    <h4>Also plan for</h4>
                    <ul>
                      {guide.facts.considerations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function SingleOptionFacts({ option, treatmentId }: { option: ResolvedOption; treatmentId: string }) {
  const guide = getOptionGuide(treatmentId, option.info.id)
  return (
    <section id="compare" className="case-section">
      <h2>Your treatment at a glance</h2>
      <article className="compare-card single">
        <header>
          <h3>{option.info.name}</h3>
          <p className="compare-price">{formatPrice(option.price)}</p>
        </header>
        {option.note && <p className="compare-note">“{option.note}”</p>}
        <dl className="compare-facts">
          <div>
            <dt>Usually lasts</dt>
            <dd>{longevityText(option, treatmentId)}</dd>
          </div>
          {guide &&
            FACT_ROWS.map((row) => (
              <div key={row.key}>
                <dt>{row.label}</dt>
                <dd>{guide.facts[row.key]}</dd>
              </div>
            ))}
        </dl>
        <ProsCons option={option.info} />
        {guide && (
          <div className="consider">
            <h4>Also plan for</h4>
            <ul>
              {guide.facts.considerations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </section>
  )
}

function ProsCons({ option }: { option: TreatmentOption }) {
  return (
    <div className="pros-cons">
      <ul className="pros">
        {option.pros.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <ul className="cons">
        {option.cons.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function FaqSection({ faqs }: { faqs: Faq[] }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const visible = faqs.filter(
    (faq) => !q || faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q),
  )

  function speak(text: string) {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
  }

  return (
    <section id="faq" className="case-section">
      <h2>Common questions</h2>
      <input
        className="faq-search"
        type="search"
        placeholder="Search questions"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="faq-list">
        {visible.map((faq) => (
          <details key={faq.question}>
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
            <button type="button" className="listen" onClick={() => speak(`${faq.question}. ${faq.answer}`)}>
              Listen
            </button>
          </details>
        ))}
        {visible.length === 0 && <p className="muted-text">No matching questions. Ask the clinic below.</p>}
      </div>
    </section>
  )
}

function NextSteps({ token, sessionKey }: { token: string; sessionKey: string }) {
  const [sent, setSent] = useState('')
  const [error, setError] = useState('')

  async function send(action: 'interested' | 'book' | 'callback', message: string) {
    setError('')
    try {
      await publicApi.action(token, sessionKey, action)
      setSent(message)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <section className="case-section next-steps">
      <h2>Ready for the next step?</h2>
      <p className="muted-text">Take your time and discuss with family. Tap below and the clinic will reach out.</p>
      {sent ? (
        <p className="sent">{sent}</p>
      ) : (
        <div className="next-actions">
          <button type="button" className="case-btn primary" onClick={() => send('book', 'Thank you! The clinic will call you to fix an appointment.')}>
            Book appointment
          </button>
          <button type="button" className="case-btn" onClick={() => send('interested', 'Thank you! The clinic has been told you are interested.')}>
            I’m interested
          </button>
          <button type="button" className="case-btn" onClick={() => send('callback', 'The clinic will call you back soon.')}>
            Call me back
          </button>
        </div>
      )}
      {error && <p className="gate-error">{error}</p>}
    </section>
  )
}
