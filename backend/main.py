from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .src.database.database import engine, base, SessionLocal
from .routers import folders, notes, agent
from .rag.chunking import run_ingestion
import datetime
# from datetime import datetime, timezone
from sqlalchemy.orm import Session
from .src.database.models import Folder, Note
from apscheduler.schedulers.background import BackgroundScheduler

def cleanup_trash():
    db: Session = SessionLocal()
    try:
        threshold_day = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)
        db.query(Note).filter(Note.is_deleted == True, Note.deleted_at < threshold_day).delete(synchronize_session=False)
        db.query(Folder).filter(Folder.is_deleted == True, Folder.deleted_at < threshold_day).delete(synchronize_session=False)
        db.commit()
        print(f"[{datetime.datetime.now(datetime.timezone.utc)}] Đã dọn dẹp thùng rác tự động.")
    except Exception as e:
        db.rollback()
        print(f"Lỗi khi dọn rác: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Khởi động server: Đang đồng bộ AI vector...")
    scheduler = BackgroundScheduler()
    scheduler.add_job(cleanup_trash, 'cron', hour=0, minute=0)
    scheduler.start()
    run_ingestion()
    yield
    scheduler.shutdown()

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