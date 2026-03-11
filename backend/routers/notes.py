from ..src.database import models
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..dependencies import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/notes", tags=["notes"])
class NoteCreate(BaseModel):
    title: str
    content: str

@router.post("/")
def create_note(note: NoteCreate, db : Session = Depends(get_db)):
    try:
        note = models.Note(title=note.title, content = note.content)
        db.add(note)
        db.commit()
        db.refresh(note)
        return note
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    try:
        note =  db.query(models.Note).filter(models.Note.id == note_id).first()
        if not note:
            raise HTTPException(status_code=404, detail=("note not found"))
        db.delete(note)
        db.commit()
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