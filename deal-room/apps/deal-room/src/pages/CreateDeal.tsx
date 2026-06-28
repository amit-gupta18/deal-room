import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateRecord } from 'lemma-sdk/react'
import { lemmaClient } from '../lemma-client'

export function CreateDeal() {
  const navigate = useNavigate()
  const { create, isSubmitting, error: createError } = useCreateRecord({
    client: lemmaClient,
    tableName: 'deals',
  })
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [headquarters, setHeadquarters] = useState('')
  const [dealSizeAsk, setDealSizeAsk] = useState('')
  const [assignedAnalyst, setAssignedAnalyst] = useState('')
  const [cimFileId, setCimFileId] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!companyName.trim()) {
      setError('Company name is required.')
      return
    }

    try {
      const result = await create({
        company_name: companyName.trim(),
        industry: industry.trim() || null,
        headquarters: headquarters.trim() || null,
        deal_size_ask: dealSizeAsk.trim() || null,
        assigned_analyst_pod_member_id: assignedAnalyst.trim() || null,
        cim_file_path: cimFileId.trim() || null,
        deal_status: 'new',
        stage: 'sourcing',
      })

      const dealId = (result as { record_id?: string } | null)?.record_id
      navigate(dealId ? `/deals/${dealId}` : '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="page">
      <h1>New Deal</h1>
      <form className="form" onSubmit={handleSubmit}>
        {(error || createError) && <div className="alert">{error || (createError as Error).message}</div>}
        <label className="field">
          <span>Company name *</span>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Acme Corp"
            required
          />
        </label>
        <label className="field">
          <span>Industry</span>
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. SaaS" />
        </label>
        <label className="field">
          <span>Headquarters</span>
          <input value={headquarters} onChange={(e) => setHeadquarters(e.target.value)} placeholder="e.g. San Francisco, CA" />
        </label>
        <label className="field">
          <span>Deal Size (ask)</span>
          <input value={dealSizeAsk} onChange={(e) => setDealSizeAsk(e.target.value)} placeholder="e.g. 50M" />
        </label>
        <label className="field">
          <span>Assigned analyst pod member ID</span>
          <input
            value={assignedAnalyst}
            onChange={(e) => setAssignedAnalyst(e.target.value)}
            placeholder="Pod member UUID"
          />
        </label>
        <label className="field">
          <span>CIM file ID (from Lemma Files)</span>
          <input value={cimFileId} onChange={(e) => setCimFileId(e.target.value)} placeholder="File record ID" />
        </label>
        <button className="btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Deal'}
        </button>
      </form>
    </div>
  )
}
