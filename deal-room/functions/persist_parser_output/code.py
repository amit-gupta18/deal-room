#input_type_name: PersistParserOutputInput
#output_type_name: PersistParserOutputResult
#function_name: persist_parser_output

from pydantic import BaseModel
from typing import Any, Optional
from lemma_sdk import FunctionContext, Pod


class PersistParserOutputInput(BaseModel):
    deal_id: str
    company_name: Optional[str] = None
    industry: Optional[str] = None
    headquarters: Optional[str] = None
    deal_size_ask: Optional[str] = None
    business_model_summary: Optional[str] = None
    management_team_summary: Optional[str] = None
    management_background: Optional[str] = None
    company_stated_risks: Optional[str] = None
    currency: Optional[str] = None
    fiscal_year_1_label: Optional[str] = None
    fiscal_year_1_revenue: Optional[float] = None
    fiscal_year_1_ebitda: Optional[float] = None
    fiscal_year_1_ebitda_margin: Optional[float] = None
    fiscal_year_2_label: Optional[str] = None
    fiscal_year_2_revenue: Optional[float] = None
    fiscal_year_2_ebitda: Optional[float] = None
    fiscal_year_2_ebitda_margin: Optional[float] = None
    fiscal_year_3_label: Optional[str] = None
    fiscal_year_3_revenue: Optional[float] = None
    fiscal_year_3_ebitda: Optional[float] = None
    fiscal_year_3_ebitda_margin: Optional[float] = None
    revenue_cagr_3y: Optional[float] = None
    yoy_growth_latest: Optional[float] = None
    total_debt: Optional[float] = None
    debt_to_ebitda: Optional[float] = None
    free_cash_flow: Optional[float] = None
    top_customer_name: Optional[str] = None
    top_customer_revenue_pct: Optional[float] = None
    top_5_customers_revenue_pct: Optional[float] = None
    customer_concentration_summary: Optional[str] = None
    extraction_confidence: Optional[float] = None
    missing_fields: Optional[Any] = None
    source_page_map: Optional[Any] = None


class PersistParserOutputResult(BaseModel):
    deal_id: str
    financials_record_id: str


async def persist_parser_output(
    ctx: FunctionContext, data: PersistParserOutputInput
) -> PersistParserOutputResult:
    pod = Pod.from_env()
    fin = pod.table("financials").create({
        "deal_id": data.deal_id,
        "currency": data.currency,
        "fiscal_year_1_label": data.fiscal_year_1_label,
        "fiscal_year_1_revenue": data.fiscal_year_1_revenue,
        "fiscal_year_1_ebitda": data.fiscal_year_1_ebitda,
        "fiscal_year_1_ebitda_margin": data.fiscal_year_1_ebitda_margin,
        "fiscal_year_2_label": data.fiscal_year_2_label,
        "fiscal_year_2_revenue": data.fiscal_year_2_revenue,
        "fiscal_year_2_ebitda": data.fiscal_year_2_ebitda,
        "fiscal_year_2_ebitda_margin": data.fiscal_year_2_ebitda_margin,
        "fiscal_year_3_label": data.fiscal_year_3_label,
        "fiscal_year_3_revenue": data.fiscal_year_3_revenue,
        "fiscal_year_3_ebitda": data.fiscal_year_3_ebitda,
        "fiscal_year_3_ebitda_margin": data.fiscal_year_3_ebitda_margin,
        "revenue_cagr_3y": data.revenue_cagr_3y,
        "yoy_growth_latest": data.yoy_growth_latest,
        "total_debt": data.total_debt,
        "debt_to_ebitda": data.debt_to_ebitda,
        "free_cash_flow": data.free_cash_flow,
        "top_customer_name": data.top_customer_name,
        "top_customer_revenue_pct": data.top_customer_revenue_pct,
        "top_5_customers_revenue_pct": data.top_5_customers_revenue_pct,
        "customer_concentration_summary": data.customer_concentration_summary,
        "management_background": data.management_background,
        "company_stated_risks": data.company_stated_risks,
        "extraction_confidence": data.extraction_confidence,
        "missing_fields": data.missing_fields,
        "source_page_map": data.source_page_map,
    })
    fin_id = str(fin["id"])
    update_fields = {}
    if data.business_model_summary is not None:
        update_fields["business_model_summary"] = data.business_model_summary
    if data.management_team_summary is not None:
        update_fields["management_team_summary"] = data.management_team_summary
    if data.company_stated_risks is not None:
        update_fields["company_key_risks_summary"] = data.company_stated_risks
    if data.industry is not None:
        update_fields["industry"] = data.industry
    if data.headquarters is not None:
        update_fields["headquarters"] = data.headquarters
    if data.deal_size_ask is not None:
        update_fields["deal_size_ask"] = data.deal_size_ask
    update_fields["stage"] = "risk_scoring"
    update_fields["parser_status"] = "completed"
    pod.table("deals").update(data.deal_id, update_fields)
    pod.table("audit_events").create({
        "deal_id": data.deal_id,
        "event_type": "parser_completed",
        "actor_type": "function",
        "actor_name": "persist_parser_output",
        "event_summary": "Parser output persisted",
        "event_payload": {"financials_record_id": fin_id},
    })
    return PersistParserOutputResult(deal_id=data.deal_id, financials_record_id=fin_id)
