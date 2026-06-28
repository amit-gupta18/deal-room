#input_type_name: PersistRiskOutputInput
#output_type_name: PersistRiskOutputResult
#function_name: persist_risk_output

from typing import Any
from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod


class RedFlagItem(BaseModel):
    flag_code: str
    severity: str
    title: str
    reasoning: str
    metric_value: Any = None
    threshold_value: Any = None
    source_page_numbers: Any = None


class PersistRiskOutputInput(BaseModel):
    deal_id: str
    deal_score: int
    investment_recommendation: str
    company_key_risks_summary: str
    red_flags: list[RedFlagItem]


class PersistRiskOutputResult(BaseModel):
    deal_id: str
    red_flag_count: int


async def persist_risk_output(
    ctx: FunctionContext, data: PersistRiskOutputInput
) -> PersistRiskOutputResult:
    pod = Pod.from_env()
    existing = pod.records.list(
        "red_flags",
        limit=200,
        filter=[{"field": "deal_id", "op": "eq", "value": data.deal_id}],
    ).to_dict()["items"]
    for row in existing:
        pod.table("red_flags").update(row["id"], {"is_active": False})
    for idx, flag in enumerate(data.red_flags):
        pod.table("red_flags").create({
            "deal_id": data.deal_id,
            "flag_code": flag.flag_code,
            "severity": flag.severity,
            "title": flag.title,
            "reasoning": flag.reasoning,
            "metric_value": flag.metric_value,
            "threshold_value": flag.threshold_value,
            "source_page_numbers": flag.source_page_numbers,
            "sort_order": idx,
            "is_active": True,
        })
    pod.table("deals").update(data.deal_id, {
        "deal_score": data.deal_score,
        "investment_recommendation": data.investment_recommendation,
        "company_key_risks_summary": data.company_key_risks_summary,
        "stage": "memo_drafting",
        "risk_status": "completed",
    })
    pod.table("audit_events").create({
        "deal_id": data.deal_id,
        "event_type": "risk_completed",
        "actor_type": "function",
        "actor_name": "persist_risk_output",
        "event_summary": f"Risk assessment completed: score {data.deal_score}, {len(data.red_flags)} flags",
        "event_payload": {"deal_score": data.deal_score, "red_flag_count": len(data.red_flags)},
    })
    return PersistRiskOutputResult(deal_id=data.deal_id, red_flag_count=len(data.red_flags))
