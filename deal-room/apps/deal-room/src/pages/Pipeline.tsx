import { useNavigate } from 'react-router-dom'
import { useLiveRecords } from 'lemma-sdk/react'
import { lemmaClient } from '../lemma-client'

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  parsing: 'Parsing',
  scored: 'Scored',
  memo_draft: 'Memo Draft',
  awaiting_review: 'Awaiting Review',
  reviewed: 'Reviewed',
}

const STATUS_ORDER = ['new', 'parsing', 'scored', 'memo_draft', 'awaiting_review', 'reviewed']

interface DealRow extends Record<string, unknown> {
  record_id: string
  company_name?: string
  deal_status?: string
  industry?: string
  assigned_analyst_pod_member_id?: string
  created_at?: string
}

export function Pipeline() {
  const navigate = useNavigate()
  const { records, isLoading, error } = useLiveRecords<DealRow>({
    client: lemmaClient,
    tableName: 'deals',
  })

  const sorted = [...(records ?? [])].sort(
    (a, b) => STATUS_ORDER.indexOf(a.deal_status ?? 'new') - STATUS_ORDER.indexOf(b.deal_status ?? 'new'),
  )

  return (
    <div className="page">
      <h1>Deal Pipeline</h1>
      {error && <div className="alert">{error.message}</div>}
      {isLoading && <p className="muted">Loading deals...</p>}
      {!isLoading && sorted.length === 0 && (
        <p className="muted">No deals yet. Create one to get started.</p>
      )}
      <div className="deal-list">
        {sorted.map((deal) => (
          <div
            key={deal.record_id}
            className="deal-card"
            onClick={() => navigate(`/deals/${deal.record_id}`)}
          >
            <div className="deal-card-header">
              <strong>{deal.company_name || 'Unnamed Deal'}</strong>
              <span className={`status-badge status-${deal.deal_status ?? 'new'}`}>
                {STATUS_LABELS[deal.deal_status ?? 'new']}
              </span>
            </div>
            {deal.industry && <div className="deal-card-meta">Industry: {deal.industry}</div>}
            {deal.assigned_analyst_pod_member_id && (
              <div className="deal-card-meta">Analyst: {deal.assigned_analyst_pod_member_id}</div>
            )}
            {deal.created_at && (
              <div className="deal-card-meta">Created: {new Date(deal.created_at).toLocaleDateString()}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
