import os
import json
import redis

redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True
)

SESSION_TTL = 1800

def set_session(candidate_id: str, data: dict):
    redis_client.setex(f"session:{candidate_id}", SESSION_TTL, json.dumps(data))

def get_session(candidate_id: str):
    val = redis_client.get(f"session:{candidate_id}")
    return json.loads(val) if val else None

def delete_session(candidate_id: str):
    redis_client.delete(f"session:{candidate_id}")
