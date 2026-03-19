from sqlalchemy import Column, Integer, String, Text, TIMESTAMP
from sqlalchemy.sql import func
from database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(100), nullable=False, index=True)
    candidate_id = Column(String(100), nullable=False, index=True)
    status = Column(String(50), default="applied")
    applied_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    notes = Column(Text, nullable=True)
