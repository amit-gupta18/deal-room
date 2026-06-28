import { useState, useEffect } from 'react'
import { lemmaClient } from '../lemma-client'
import { useWorkflowRunWaitAssignments, useWorkflowResume } from 'lemma-sdk/react'

interface WaitAssignment {
  run: { id: string; status?: string }
  wait: { id: string; node_id: string; payload?: Record<string, unknown>; created_at?: string }
}

export function ReviewQueue() {
  const { assignments, isLoading, error: assignError, refresh } = useWorkflowRunWaitAssignments({
    client: lemmaClient,
  })
  const { resume, isResuming } = useWorkflowResume({ client: lemmaClient })

  const [reviewStates, setReviewStates] = useState<Record<string, {
    decision: string
    editedBody: string
    reviewNotes: string
    rejectionReason: string
    submitting: boolean
    error: string
  }>>({})

  // TODO: replace with real current user lookup
  const myUserId = '087900a7-15d7-4053-abe4-80af0a30f9b0'

  const waitItems: WaitAssignment[] = (assignments ?? []) as WaitAssignment[]

  useEffect(() => {
    if (waitItems.length > 0) {
      const initial: Record<string, typeof reviewStates[string]> = {}
      for (const item of waitItems) {
        initial[item.run.id] = {
          decision: 'approve',
          editedBody: '',
          reviewNotes: '',
          rejectionReason: '',
          submitting: false,
          error: '',
        }
      }
      setReviewStates((prev) => ({ ...prev, ...initial }))
    }
  }, [assignments])

  const update = (runId: string, patch: Partial<typeof reviewStates[string]>) => {
    setReviewStates((prev) => ({
      ...prev,
      [runId]: {
        ...(prev[runId] ?? { decision: 'approve', editedBody: '', reviewNotes: '', rejectionReason: '', submitting: false, error: '' }),
        ...patch,
      },
    }))
  }

  const handleSubmit = async (item: WaitAssignment) => {
    const st = reviewStates[item.run.id]
    if (!st) return
    update(item.run.id, { submitting: true, error: '' })

    try {
      await resume(
        {
          decision: st.decision,
          edited_body_markdown: st.editedBody,
          review_notes: st.reviewNotes,
          rejection_reason: st.rejectionReason,
          reviewer_user_id: myUserId,
        },
        { runId: item.run.id, nodeId: item.wait.node_id },
      )
      refresh()
    } catch (err) {
      update(item.run.id, { error: err instanceof Error ? err.message : String(err) })
    } finally {
      update(item.run.id, { submitting: false })
    }
  }

  if (isLoading) return <div className="page"><p className="muted">Loading review queue...</p></div>
  if (assignError) return <div className="page"><div className="alert">{assignError.message}</div></div>

  return (
    <div className="page">
      <h1>Review Queue</h1>
      {waitItems.length === 0 && <p className="muted">No pending reviews. Deals awaiting review will appear here.</p>}
      <div className="review-list">
        {waitItems.map((item) => {
          const st = reviewStates[item.run.id] ?? { decision: 'approve', editedBody: '', reviewNotes: '', rejectionReason: '', submitting: false, error: '' }
          return (
            <div key={item.run.id} className="panel review-card">
              <div className="section-title">Review: Run {item.run.id.slice(0, 8)}</div>
              {st.error && <div className="alert">{st.error}</div>}
              <label className="field">
                <span>Decision</span>
                <select value={st.decision} onChange={(e) => update(item.run.id, { decision: e.target.value })}>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                </select>
              </label>
              <label className="field">
                <span>Edited memo body</span>
                <textarea
                  value={st.editedBody}
                  onChange={(e) => update(item.run.id, { editedBody: e.target.value })}
                  rows={8}
                  placeholder="Paste or edit the memo body markdown..."
                />
              </label>
              <label className="field">
                <span>Review notes</span>
                <textarea
                  value={st.reviewNotes}
                  onChange={(e) => update(item.run.id, { reviewNotes: e.target.value })}
                  rows={3}
                  placeholder="Notes for the team..."
                />
              </label>
              {st.decision === 'reject' && (
                <label className="field">
                  <span>Rejection reason</span>
                  <textarea
                    value={st.rejectionReason}
                    onChange={(e) => update(item.run.id, { rejectionReason: e.target.value })}
                    rows={3}
                    placeholder="Why is this deal being rejected?"
                  />
                </label>
              )}
              <button className="btn" onClick={() => handleSubmit(item)} disabled={st.submitting || isResuming}>
                {st.submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
