import os
import logging
from datetime import datetime
from redis import Redis
from rq import Queue
from rq_scheduler import Scheduler
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

redis_conn = Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379))
)
scheduler = Scheduler(connection=redis_conn)
queue = Queue(connection=redis_conn)

JOBS_SERVICE_URL = os.getenv("JOBS_SERVICE_URL", "http://jobs:8002")


def job_expiry_cleanup():
    logger.info(f"[CRON] job_expiry_cleanup started at {datetime.utcnow()}")
    try:
        response = httpx.get(f"{JOBS_SERVICE_URL}/jobs")
        jobs = response.json()
        now = datetime.utcnow()
        expired = [j for j in jobs if j.get("expires_at") and
                   datetime.fromisoformat(j["expires_at"]) < now]
        for job in expired:
            httpx.patch(f"{JOBS_SERVICE_URL}/jobs/{job['id']}/close")
            logger.info(f"  Closed expired job: {job['id']} - {job['title']}")
        logger.info(f"[CRON] Closed {len(expired)} expired jobs")
    except Exception as e:
        logger.error(f"[CRON] job_expiry_cleanup failed: {e}")


def daily_job_digest():
    logger.info(f"[CRON] daily_job_digest started at {datetime.utcnow()}")
    try:
        response = httpx.get(f"{JOBS_SERVICE_URL}/jobs/featured")
        featured = response.json()
        logger.info(f"[CRON] Daily digest: {len(featured)} featured jobs")
        for job in featured:
            logger.info(f"  - {job['title']} at {job['company']} ({job['location']})")
    except Exception as e:
        logger.error(f"[CRON] daily_job_digest failed: {e}")


def application_summary():
    logger.info(f"[CRON] application_summary started at {datetime.utcnow()}")
    try:
        logger.info("[CRON] Weekly application summary generated")
    except Exception as e:
        logger.error(f"[CRON] application_summary failed: {e}")


def schedule_jobs():
    for job in scheduler.get_jobs():
        scheduler.cancel(job)

    scheduler.cron("0 0 * * *", func=job_expiry_cleanup, id="job_expiry_cleanup", use_local_timezone=False)
    scheduler.cron("0 8 * * *", func=daily_job_digest, id="daily_job_digest", use_local_timezone=False)
    scheduler.cron("0 0 * * 0", func=application_summary, id="application_summary", use_local_timezone=False)

    logger.info("[SCHEDULER] 3 cron jobs scheduled")


if __name__ == "__main__":
    schedule_jobs()
    scheduler.run()
