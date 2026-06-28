#input_type_name: CreateDealSubmissionInput
#output_type_name: CreateDealSubmissionResult
#function_name: create_deal_submission

from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod


class CreateDealSubmissionInput(BaseModel):
    company_name: str
    source_type: str
    cim_file_path: str
    submitted_by_user_id: str
    assigned_analyst_user_id: str
    assigned_analyst_pod_member_id: str


class CreateDealSubmissionResult(BaseModel):
    deal_id: str


async def create_deal_submission(
    ctx: FunctionContext, data: CreateDealSubmissionInput
) -> CreateDealSubmissionResult:
    pod = Pod.from_env()
    deal = pod.table("deals").create({
        "company_name": data.company_name,
        "source_type": data.source_type,
        "cim_file_path": data.cim_file_path,
        "submitted_by_user_id": data.submitted_by_user_id,
        "assigned_analyst_user_id": data.assigned_analyst_user_id,
        "assigned_analyst_pod_member_id": data.assigned_analyst_pod_member_id,
        "stage": "intake_pending",
        "parser_status": "pending",
        "risk_status": "pending",
        "memo_status": "pending",
    })
    deal_id = str(deal["id"])
    pod.table("audit_events").create({
        "deal_id": deal_id,
        "event_type": "deal_created",
        "actor_type": "user",
        "actor_name": data.submitted_by_user_id,
        "event_summary": f"Deal created for {data.company_name}",
        "event_payload": {"source_type": data.source_type},
    })
    return CreateDealSubmissionResult(deal_id=deal_id)
