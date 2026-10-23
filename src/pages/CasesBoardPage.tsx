import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { STATUS_LABELS, URGENCY_LABELS, staffApi } from '../api/client'
import type { CaseStatus, CaseSummary } from '../api/client'
import { getTreatment } from '../data/treatments'
import '../styles/consult.css'

const FILTERS: { id: 'all' | 'followup' | CaseStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'followup', label: 'Follow-up due' },
  { id: 'considering', label: 'Considering' },
  { id: 'shared', label: 'Link sent' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'draft', label: 'Drafts' },
]

const REQUEST_LABELS = { interested: 'Interested', book: 'Wants to book', callback: 'Call back' }

const today = () => new Date().toISOString().slice(0, 10)

export function CasesBoardPage() {
  const [cases, setCases] = useState<CaseSummary[] | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    staffApi
      .listCases()
      .then(setCases)
      .catch((err: Error) => setError(err.message))
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (cases ?? []).filter((item) => {
      if (filter === 'followup' && !(item.followupDate && item.followupDate <= today())) return false
      if (filter !== 'all' && filter !== 'followup' && item.status !== filter) return false
      return !q || item.patientName.toLowerCase().includes(q) || item.patientPhone.includes(q)
    })
  }, [cases, filter, query])

  return (
    <main className="page">
      <div className="board-head">
        <div>
          <span className="eyebrow">Consultations</span>
          <h1 className="headline">Patient cases</h1>
        </div>
        <Link className="btn-primary" to="/consult/new">
          New consult
        </Link>
      </div>

      <div className="board-toolbar">
        <div className="segmented" role="tablist" aria-label="Filter cases">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={filter === item.id ? 'active' : ''}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <input
          className="field-input board-search"
          type="search"
          placeholder="Search name or phone"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {error && <p className="form-error">{error}</p>}
      {!cases && !error && <p className="muted">Loading cases…</p>}
      {cases && visible.length === 0 && (
        <div className="empty-state">
          <p>No cases here yet.</p>
          <Link to="/consult/new">Start a consult</Link>
        </div>
      )}

      <ul className="case-list">
        {visible.map((item) => (
          <li key={item.id}>
            <Link to={`/cases/${item.id}`} className="case-row">
              <div className="case-row-main">
                <strong>{item.patientName}</strong>
                <span className="muted">
                  {item.complaint || 'No complaint noted'} · {getTreatment(item.treatmentId)?.name ?? item.treatmentId}
                </span>
              </div>
              <div className="case-row-tags">
                {item.lastRequest && <span className="tag tag-accent">{REQUEST_LABELS[item.lastRequest]}</span>}
                {item.urgency !== 'routine' && (
                  <span className={`tag urgency-${item.urgency}`}>{URGENCY_LABELS[item.urgency]}</span>
                )}
                <span className={`tag status-${item.status}`}>{STATUS_LABELS[item.status]}</span>
              </div>
              <div className="case-row-meta muted">
                <span>{item.opens > 0 ? `Opened ${item.opens}×` : 'Not opened'}</span>
                {item.followupDate && (
                  <span className={item.followupDate <= today() ? 'overdue' : ''}>Follow up {item.followupDate}</span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
