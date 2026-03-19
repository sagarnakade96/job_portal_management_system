import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from models import Job

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB_JOBS", "jobsdb")

async def init_db():
    client = AsyncIOMotorClient(MONGO_URI)
    await init_beanie(database=client[MONGO_DB], document_models=[Job])
