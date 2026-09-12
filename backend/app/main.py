from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

# Auth uses Bearer tokens (not cookies), so credentials are not required.
# The CORS spec forbids wildcard origins together with credentials, so when
# all origins are allowed we disable credentials to keep the wildcard valid.
_cors_allow_all = settings.cors_allow_all
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _cors_allow_all else settings.cors_origins_list,
    allow_credentials=not _cors_allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
