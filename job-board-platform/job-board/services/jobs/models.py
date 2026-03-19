from beanie import Document
from pydantic import Field
from typing import List, Optional
from datetime import datetime

class Job(Document):
    title: str
    company: str
    location: str
    description: str
    salary_range: Optional[str] = None
    tags: List[str] = []
    is_featured: bool = False
    is_closed: bool = False
    expires_at: Optional[datetime] = None
    posted_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "jobs"
