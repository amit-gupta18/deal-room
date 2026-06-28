#input_type_name: RecordReviewDecisionInput
#output_type_name: RecordReviewDecisionResult
#function_name: record_review_decision

from typing import Optional
from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod
from datetime import datetime, timezone


class RecordReviewDecisionInput(BaseModel):
    deal_id: str
    memo_id: str
    decision: str
    edited_body_markdown: str
    review_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    reviewer_user_id: str


class RecordReviewDecisionResult(BaseModel):
    deal_id: str
    final_stage: str


async def record_review_decision(
    ctx: FunctionContext, data: RecordReviewDecisionInput
) -> RecordReviewDecisionResult:
    pod = Pod.from_env()
    now = datetime.now(timezone.utc).isoformat()
    memo = pod.table("memos").get(data.memo_id)
    memo_update = {}
    if data.edited_body_markdown != memo.get("body_markdown", ""):
        memo_update["body_markdown"] = data.edited_body_markdown
        memo_update["edited_by_user_id"] = data.reviewer_user_id
    if data.decision == "approve":
        memo_update["status"] = "approved"
        memo_update["approved_by_user_id"] = data.reviewer_user_id
        memo_update["approved_at"] = now
        deal_stage = "under_review"
        memo_status = "approved"
        event_type = "review_approved"
        summary = "Memo approved by analyst"
    else:
        memo_update["status"] = "rejected"
        memo_update["rejected_at"] = now
        deal_stage = "archived"
        memo_status = "rejected"
        event_type = "review_rejected"
        summary = "Memo rejected by analyst"
    if memo_update:
        pod.table("memos").update(data.memo_id, memo_update)
    deal_update = {
        "stage": deal_stage,
        "memo_status": memo_status,
        "last_reviewed_at": now,
        "last_reviewer_user_id": data.reviewer_user_id,
    }
    if data.decision == "reject" and data.rejection_reason:
        deal_update["rejection_reason"] = data.rejection_reason
    pod.table("deals").update(data.deal_id, deal_update)
    pod.table("audit_events").create({
        "deal_id": data.deal_id,
        "event_type": event_type,
        "actor_type": "user",
        "actor_name": data.reviewer_user_id,
        "event_summary": summary,
        "event_payload": {"decision": data.decision, "memo_id": data.memo_id},
        "related_memo_id": data.memo_id,
    })
    return RecordReviewDecisionResult(deal_id=data.deal_id, final_stage=deal_stage)
