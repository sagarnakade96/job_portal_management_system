import json
from fastapi import APIRouter, HTTPException, Query
from models import Job
from schemas import JobCreate, JobResponse
from redis_client import get_redis
from typing import List

router = APIRouter(prefix="/jobs", tags=["Jobs"])
redis = get_redis()

TTL_LIST = 300
TTL_FEATURED = 600
TTL_SEARCH = 120


@router.post("", status_code=201)
async def create_job(payload: JobCreate):
    job = Job(**payload.model_dump())
    await job.insert()
    redis.delete("jobs:list")
    return {"id": str(job.id), "message": "Job posted successfully"}


@router.get("", response_model=List[dict])
async def list_jobs():
    cached = redis.get("jobs:list")
    if cached:
        return json.loads(cached)
    jobs = await Job.find(Job.is_closed == False).to_list()
    result = [
        {"id": str(j.id), "title": j.title, "company": j.company,
         "location": j.location, "tags": j.tags, "is_featured": j.is_featured}
        for j in jobs
    ]
    redis.setex("jobs:list", TTL_LIST, json.dumps(result))
    return result


@router.get("/search")
async def search_jobs(q: str = Query(..., description="Search term")):
    cache_key = f"jobs:search:{q.lower()}"
    cached = redis.get(cache_key)
    if cached:
        return json.loads(cached)
    jobs = await Job.find(
        {"$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"location": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}}
        ]}
    ).to_list()
    result = [
        {"id": str(j.id), "title": j.title, "company": j.company, "location": j.location}
        for j in jobs
    ]
    redis.setex(cache_key, TTL_SEARCH, json.dumps(result))
    return result


@router.patch("/{job_id}/close")
async def close_job(job_id: str):
    job = await Job.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_closed = True
    await job.save()
    redis.delete("jobs:list")
    redis.delete("jobs:featured")
    return {"message": f"Job {job_id} closed"}


@router.get("/featured")
async def featured_jobs():
    cached = redis.get("jobs:featured")
    if cached:
        return json.loads(cached)
    jobs = await Job.find(
        Job.is_featured == True, Job.is_closed == False
    ).to_list()
    result = [
        {"id": str(j.id), "title": j.title, "company": j.company, "location": j.location}
        for j in jobs
    ]
    redis.setex("jobs:featured", TTL_FEATURED, json.dumps(result))
    return result
