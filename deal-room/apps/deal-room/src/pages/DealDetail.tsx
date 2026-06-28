import { useParams, useNavigate } from 'react-router-dom'
import { useLiveRecords, useDatastoreQuery } from 'lemma-sdk/react'
import { lemmaClient } from '../lemma-client'
import { ArrowLeft } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  parsing: 'Parsing',
  scored: 'Scored',
  memo_draft: 'Memo Draft',
  awaiting_review: 'Awaiting Review',
  reviewed: 'Reviewed',
}

interface DealRow extends Record<string, unknown> {
  record_id: string
  company_name?: string
  deal_status?: string
  stage?: string
  industry?: string
  headquarters?: string
  deal_size_ask?: string
  cim_file_path?: string
  assigned_analyst_pod_member_id?: string
  risk_score?: number
  latest_memo_id?: string
  created_at?: string
  updated_at?: string
}

interface FinancialRow extends Record<string, unknown> {
  record_id: string
  revenue?: number
  ebitda?: number
  ebitda_margin?: number
  fiscal_year_label?: string
}

interface RedFlagRow extends Record<string, unknown> {
  record_id: string
  flag_type?: string
  severity?: string
  description?: string
}

interface MemoRow extends Record<string, unknown> {
  record_id: string
  executive_summary?: string
  recommendation?: string
  body_markdown?: string
  status?: string
}

export function DealDetail() {
  const { dealId } = useParams<{ dealId: string }>()
  const navigate = useNavigate()

  const { records, isLoading: dealsLoading } = useLiveRecords<DealRow>({
    client: lemmaClient,
    tableName: 'deals',
  })
  const { items: financials, isLoading: finLoading } = useDatastoreQuery<FinancialRow>({
    client: lemmaClient,
    query: `SELECT * FROM financials WHERE deal_id = '${dealId}' ORDER BY fiscal_year_label`,
    enabled: !!dealId,
  })
  const { items: redFlags, isLoading: rfLoading } = useDatastoreQuery<RedFlagRow>({
    client: lemmaClient,
    query: `SELECT * FROM red_flags WHERE deal_id = '${dealId}' ORDER BY severity`,
    enabled: !!dealId,
  })
  const { items: memos, isLoading: memoLoading } = useDatastoreQuery<MemoRow>({
    client: lemmaClient,
    query: `SELECT * FROM memos WHERE deal_id = '${dealId}' ORDER BY created_at DESC LIMIT 1`,
    enabled: !!dealId,
  })

  const deal: DealRow | undefined = (records ?? []).find((d) => d.record_id === dealId)
  const memo = memos?.[0]

  if (dealsLoading) return <div className="page"><p className="muted">Loading deal...</p></div>

  if (!deal) return (
    <div className="page">
      <p className="muted">Deal not found.</p>
      <button className="btn" onClick={() => navigate('/')}>Back to Pipeline</button>
    </div>
  )

  return (
    <div className="page">
      <button className="btn-link" onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> Pipeline
      </button>

      <div className="detail-header">
        <h1>{deal.company_name || 'Unnamed Deal'}</h1>
        <span className={`status-badge status-${deal.deal_status ?? 'new'}`}>
          {STATUS_LABELS[deal.deal_status ?? 'new']}
        </span>
      </div>

      <section className="panel">
        <div className="section-title">Deal Information</div>
        <dl className="detail-grid">
          <dt>Industry</dt><dd>{deal.industry || '—'}</dd>
          <dt>Headquarters</dt><dd>{deal.headquarters || '—'}</dd>
          <dt>Deal Size (ask)</dt><dd>{deal.deal_size_ask || '—'}</dd>
          <dt>Stage</dt><dd>{deal.stage || '—'}</dd>
          <dt>Risk Score</dt><dd>{deal.risk_score != null ? deal.risk_score : '—'}</dd>
          <dt>CIM File</dt><dd>{deal.cim_file_path || '—'}</dd>
          <dt>Analyst</dt><dd>{deal.assigned_analyst_pod_member_id || '—'}</dd>
          <dt>Created</dt><dd>{deal.created_at ? new Date(deal.created_at).toLocaleString() : '—'}</dd>
        </dl>
      </section>

      {!finLoading && financials && financials.length > 0 && (
        <section className="panel">
          <div className="section-title">Financial Highlights</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Revenue</th>
                <th>EBITDA</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {financials.map((f: FinancialRow) => (
                <tr key={f.record_id}>
                  <td>{f.fiscal_year_label || '—'}</td>
                  <td>{f.revenue != null ? f.revenue.toLocaleString() : '—'}</td>
                  <td>{f.ebitda != null ? f.ebitda.toLocaleString() : '—'}</td>
                  <td>{f.ebitda_margin != null ? `${(f.ebitda_margin * 100).toFixed(1)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!rfLoading && redFlags && redFlags.length > 0 && (
        <section className="panel">
          <div className="section-title">Risk Flags</div>
          {redFlags.map((rf: RedFlagRow) => (
            <div key={rf.record_id} className={`flag-card flag-${rf.severity || 'medium'}`}>
              <strong>{rf.flag_type || 'Flag'}</strong>
              <span className={`severity severity-${rf.severity || 'medium'}`}>{rf.severity}</span>
              <p>{rf.description}</p>
            </div>
          ))}
        </section>
      )}

      {!memoLoading && memo && (
        <section className="panel">
          <div className="section-title">Investment Memo</div>
          {memo.executive_summary && (
            <>
              <div className="section-title">Executive Summary</div>
              <p>{memo.executive_summary}</p>
            </>
          )}
          {memo.recommendation && (
            <>
              <div className="section-title">Recommendation</div>
              <p>{memo.recommendation}</p>
            </>
          )}
          {memo.body_markdown && (
            <details>
              <summary>Full Memo</summary>
              <pre className="memo-body">{memo.body_markdown}</pre>
            </details>
          )}
        </section>
      )}
    </div>
  )
}
