from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..src.database import models
from ..dependencies import get_db
from pydantic import BaseModel

class FolderCreate(BaseModel):
    name: str


router=APIRouter(prefix="/folders", tags=["folders"])
@router.post("/")
def create_folder(folder: FolderCreate, db: Session = Depends(get_db)):
    try:
        new_folder = models.Folder(name=folder.name)
        db.add(new_folder)
        db.commit()
        db.refresh(new_folder)
        return new_folder
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{folder_id}")
def delete_folder(folder_id:int, db: Session=Depends(get_db)):
    try:
        folder = db.query(models.Folder).filter(models.Folder.id == folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        db.delete(folder)
        db.commit()
        return {"detail": "Folder deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/{folder_id}")
def get_folder(folder_id: int, db: Session = Depends(get_db)):
    try:
        return db.query(models.Folder).filter(models.Folder.id == folder_id).first()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/")
def get_folders(db: Session = Depends(get_db)):
    try:
        return db.query(models.Folder).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))