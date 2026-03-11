from fastapi import FastAPI
from .src.database.database import engine, base
from .routers import folders, notes
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

base.metadata.create_all(bind=engine)
app.include_router(folders.router)
app.include_router(notes.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)