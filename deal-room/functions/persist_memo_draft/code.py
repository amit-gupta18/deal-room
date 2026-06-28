#input_type_name: PersistMemoDraftInput
#output_type_name: PersistMemoDraftResult
#function_name: persist_memo_draft

from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod


class PersistMemoDraftInput(BaseModel):
    deal_id: str
    executive_summary: str
    financial_highlights: str
    risk_assessment: str
    recommendation: str
    recommendation_reasoning: str
    body_markdown: str
    drafted_by_agent_name: str


class PersistMemoDraftResult(BaseModel):
    deal_id: str
    memo_id: str
    version_number: int


async def persist_memo_draft(
    ctx: FunctionContext, data: PersistMemoDraftInput
) -> PersistMemoDraftResult:
    pod = Pod.from_env()
    existing = pod.records.list(
        "memos",
        limit=1,
        filter=[{"field": "deal_id", "op": "eq", "value": data.deal_id}],
        sort=[{"field": "version_number", "direction": "desc"}],
    ).to_dict()["items"]
    latest_version = existing[0]["version_number"] if existing else 0
    new_version = latest_version + 1
    memo = pod.table("memos").create({
        "deal_id": data.deal_id,
        "version_number": new_version,
        "status": "draft",
        "executive_summary": data.executive_summary,
        "financial_highlights": data.financial_highlights,
        "risk_assessment": data.risk_assessment,
        "recommendation": data.recommendation,
        "recommendation_reasoning": data.recommendation_reasoning,
        "body_markdown": data.body_markdown,
        "drafted_by_agent_name": data.drafted_by_agent_name,
    })
    memo_id = str(memo["id"])
    pod.table("deals").update(data.deal_id, {
        "latest_memo_id": memo_id,
        "stage": "awaiting_human_review",
        "memo_status": "draft_ready",
    })
    pod.table("audit_events").create({
        "deal_id": data.deal_id,
        "event_type": "memo_drafted",
        "actor_type": "agent",
        "actor_name": data.drafted_by_agent_name,
        "event_summary": f"Memo draft v{new_version} created",
        "event_payload": {"memo_id": memo_id, "version_number": new_version},
        "related_memo_id": memo_id,
    })
    return PersistMemoDraftResult(
        deal_id=data.deal_id, memo_id=memo_id, version_number=new_version
    )
