from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from ..src.database import models
from ..dependencies import get_db
from pydantic import BaseModel
from ..src.database.models import FolderCreate, FolderUpdate
from ..rag.chunking import run_ingestion

router=APIRouter(prefix="/folders", tags=["folders"])
@router.post("/")
def create_folder(folder: FolderCreate,  db: Session = Depends(get_db)):
    try:
        new_folder = models.Folder(name=folder.name)
        db.add(new_folder)
        db.commit()
        db.refresh(new_folder)
        return new_folder
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{folder_id}")
def delete_folder(folder_id:int, bgt:BackgroundTasks, db: Session=Depends(get_db)):
    try:
        folder = db.query(models.Folder).filter(models.Folder.id == folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        
        # delete recursive
        def delete_recursive(cur_folder_id: int) :
            #  delete all notes has folder_id == cur_folder_id
            db.query(models.Note).filter(models.Note.folder_id == cur_folder_id).delete(synchronize_session=False)

            child_folders = db.query(models.Folder).filter(models.Folder.parent_id == cur_folder_id).all()
            for child in child_folders:
                delete_recursive(child.id)

            db.query(models.Folder).filter(models.Folder.id == cur_folder_id).delete(synchronize_session=False)

        delete_recursive(folder.id)
        db.commit()

        bgt.add_task(run_ingestion)
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
    
@router.put("/{id}")
def update_folder(id: int, folder_data: FolderCreate, db: Session = Depends(get_db)):
    try: 
        folder = db.query(models.Folder).filter(models.Folder.id == id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        folder.name = folder_data.name
        db.commit()
        db.refresh(folder)
        return folder
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.put("/{id}/move")
def move_folder_to_parent(id: int, data: FolderUpdate, db: Session = Depends(get_db)):
    try: 
        folder = db.query(models.Folder).filter(models.Folder.id == id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        folder.parent_id = data.folder_id
        db.commit()
        db.refresh(folder)
        return folder
    except Exception as e:
        raise HTTPException(status_code=500, detail=(e))
        
