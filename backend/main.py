from fastapi import FastAPI
from .src.database.database import engine, base

app = FastAPI()

base.metadata.create_all(bind=engine)
