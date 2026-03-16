from ..src.database import models
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from ..dependencies import get_db
from ..src.database.models import NoteCreate, FolderUpdate
from ..rag.chunking import run_ingestion

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("/")
def create_note(note: NoteCreate, bgt: BackgroundTasks, db : Session = Depends(get_db)):
    try:
        note = models.Note(title=note.title, content = note.content)
        db.add(note)
        db.commit()
        db.refresh(note)

        bgt.add_task(run_ingestion)
        return note
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{note_id}")
def delete_note(note_id: int,bgt: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        note =  db.query(models.Note).filter(models.Note.id == note_id).first()
        if not note:
            raise HTTPException(status_code=404, detail=("note not found"))
        db.delete(note)
        db.commit()

        bgt.add_task(run_ingestion)

        return {"detail": "note deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=(e))

@router.get("/{note_id}")
def get_note(note_id: int, db: Session = Depends(get_db)):
    try:
        return db.query(models.Note).filter(models.Note.id == note_id).first()
    except Exception as e:
        raise HTTPException(status_code=500, detail=(e))
    

@router.get("/")
def get_all_notes(db: Session=Depends(get_db)):
    try:
        return db.query(models.Note).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=(e))
    

@router.put("/{id}")
def update_note(id: int, updated_note: NoteCreate, bgt: BackgroundTasks, db: Session=Depends(get_db)):
    try:
        note = db.query(models.Note).filter(models.Note.id == id).first()
        if not note:
            raise HTTPException(status_code=404, detail="note not found")
        note.title = updated_note.title
        note.content = updated_note.content
        db.commit()
        db.refresh(note)

        bgt.add_task(run_ingestion)
        
        return note
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.put("/{id}/folder")
def update_note_to_folder(id: int, data: FolderUpdate, db: Session = Depends(get_db)):
    try:
        note = db.query(models.Note).filter(models.Note.id == id).first()
        if not note:
            raise HTTPException(status_code=404, detail="note not found")
        note.folder_id = data.folder_id
        db.commit()
        db.refresh(note)
        return note
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))