from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from models import Application
from schemas import ApplicationCreate, ApplicationResponse, PipelineEntry
from database import get_db
from typing import List

router = APIRouter(prefix="/applications", tags=["Applications"])


# 1. POST /applications/apply
@router.post("/apply", status_code=201, response_model=ApplicationResponse)
async def apply_for_job(payload: ApplicationCreate, db: AsyncSession = Depends(get_db)):
    app = Application(**payload.model_dump())
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return app


# 2. GET /applications/{id}/status
@router.get("/{app_id}/status", response_model=ApplicationResponse)
async def get_status(app_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


# 3. PATCH /applications/{id}/shortlist
@router.patch("/{app_id}/shortlist", response_model=ApplicationResponse)
async def shortlist(app_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = "shortlisted"
    await db.commit()
    await db.refresh(app)
    return app


# 4. PATCH /applications/{id}/reject
@router.patch("/{app_id}/reject", response_model=ApplicationResponse)
async def reject(app_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = "rejected"
    await db.commit()
    await db.refresh(app)
    return app


# 5. GET /applications/pipeline/{job_id}
@router.get("/pipeline/{job_id}", response_model=List[PipelineEntry])
async def pipeline(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Application.status, func.count(Application.id).label("count"))
        .where(Application.job_id == job_id)
        .group_by(Application.status)
    )
    rows = result.all()
    return [{"status": row.status, "count": row.count} for row in rows]
