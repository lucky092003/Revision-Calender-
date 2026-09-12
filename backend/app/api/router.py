from fastapi import APIRouter

from app.api import auth, revisions, topics

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(topics.router)
api_router.include_router(revisions.router)