from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app import db, search
from app.settings import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.open_pool()
    try:
        yield
    finally:
        await db.close_pool()


settings = get_settings()

app = FastAPI(
    title="Pelintir API",
    description="Benchmark harga pengadaan barang dan jasa pemerintah.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Health(BaseModel):
    status: str
    postgres: bool
    meilisearch: bool


@app.get("/health", response_model=Health, tags=["meta"])
async def health() -> Health:
    postgres = await db.ping()
    meilisearch = await search.ping()
    return Health(
        status="ok" if postgres and meilisearch else "degraded",
        postgres=postgres,
        meilisearch=meilisearch,
    )
