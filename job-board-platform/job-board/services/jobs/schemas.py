from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    description: str
    salary_range: Optional[str] = None
    tags: List[str] = []
    is_featured: bool = False
    expires_at: Optional[datetime] = None

class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    location: str
    description: str
    salary_range: Optional[str]
    tags: List[str]
    is_featured: bool
    is_closed: bool
    posted_at: datetime
