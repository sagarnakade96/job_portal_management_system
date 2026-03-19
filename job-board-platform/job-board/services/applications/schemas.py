from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ApplicationCreate(BaseModel):
    job_id: str
    candidate_id: str
    notes: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: int
    job_id: str
    candidate_id: str
    status: str
    applied_at: datetime
    notes: Optional[str]

    model_config = {"from_attributes": True}

class PipelineEntry(BaseModel):
    status: str
    count: int
