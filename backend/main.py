from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .src.database.database import engine, base
from .routers import folders, notes, agent
from .rag.chunking import run_ingestion

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Khởi động server: Đang đồng bộ AI vector...")
    run_ingestion()
    yield

app = FastAPI(lifespan=lifespan)

base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(folders.router)
app.include_router(notes.router)
app.include_router(agent.router)