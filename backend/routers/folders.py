from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from ..src.database import models
from ..dependencies import get_db
from pydantic import BaseModel
from ..src.database.models import FolderCreate, FolderUpdate
from ..rag.chunking import run_ingestion
from sqlalchemy import select

from datetime import datetime, timezone

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
    
@router.get("/trash")
def get_trashed_folders(db: Session = Depends(get_db)):
    try:
        return db.query(models.Folder).filter(models.Folder.is_deleted == True).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.put("/restore")
def restore_all_folders(db: Session=Depends(get_db)):
    try:
        # Lệnh update hàng loạt thì không cần db.refresh()
        updated_rows = db.query(models.Folder).filter(models.Folder.is_deleted == True).update({
            "is_deleted" : False,
            "deleted_at" : None
        }, synchronize_session=False)
        
        if updated_rows == 0:
            raise HTTPException(status_code=404, detail="No deleted folders to restore")
        
        db.commit()
        return {"detail": f"Restored {updated_rows} folders"}
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
            db.query(models.Note).filter(models.Note.folder_id == cur_folder_id, models.Note.is_deleted == False).update({
                "folder_id" : None
            }, synchronize_session=False)
            #  delete all notes has folder_id == cur_folder_id
            db.query(models.Note).filter(models.Note.folder_id == cur_folder_id , models.Note.is_deleted == True).delete(synchronize_session=False)

            child_folders = db.query(models.Folder).filter(models.Folder.parent_id == cur_folder_id).all()
            for child in child_folders:
                if child.is_deleted == True:
                    delete_recursive(child.id)
                else:
                    db.query(models.Folder).filter(models.Folder.parent_id == cur_folder_id).update({
                        "parent_id" : None
                    }, synchronize_session=False)

            db.query(models.Folder).filter(models.Folder.id == child.id).delete(synchronize_session=False)

        delete_recursive(folder.id)
        db.commit()

        bgt.add_task(run_ingestion)
        return {"detail": "Folder deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#  recursive cte
def get_subtree(folder_id: int, db: Session):
    folder_tree = (
        select(models.Folder.id)
        .where(models.Folder.id == folder_id)
        .cte(name="folder_tree", recursive=True)
    )   

    # alias folder table
    folder_alias = models.Folder.__table__.alias()

    folder_tree = folder_tree.union_all(
        select(folder_alias.c.id).where(
            folder_alias.c.parent_id == folder_tree.c.id
        )
    )

    query = select(folder_tree.c.id)
    ids = db.execute(query).scalars().all()
    return ids


def trash_recursive(cur_folder_id : int, db: Session) :
        now = datetime.now(timezone.utc)
        ids = get_subtree(cur_folder_id, db)
        db.query(models.Note).filter(models.Note.folder_id.in_(ids)).update({
            "is_deleted" : True,
            "deleted_at" : now
        }, synchronize_session=False)

        db.query(models.Folder).filter(models.Folder.id.in_(ids)).update({
            "is_deleted" : True,
            "deleted_at" : now
        }, synchronize_session=False)


@router.put("/{id}/trash")
def trash_folder (id: int, bgt: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        folder = db.query(models.Folder).filter(models.Folder.id == id).first()

        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        trash_recursive(cur_folder_id=id, db=db)

        db.commit()
        bgt.add_task(run_ingestion)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/trash")
def trash_all_folders ( bgt: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        now = datetime.now(timezone.utc)
        db.query(models.Folder).filter(models.Folder.is_deleted == False).update({
            "is_deleted" : True,
            "deleted_at" : now
        }, synchronize_session=False)

        db.query(models.Note).filter(models.Note.is_deleted == False, models.Note.folder_id == None).update({
            "is_deleted" : True,
            "deleted_at" : now
        }, synchronize_session=False)

        db.commit()
        bgt.add_task(run_ingestion)

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
        return db.query(models.Folder).filter(models.Folder.is_deleted == False).all()
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
        

@router.put("/{id}/favorite")
def toggle_favorite_folder (id: int, db: Session = Depends(get_db)):
    try:
        f = db.query(models.Folder).filter(models.Folder.id == id).first()
        if not f:
            raise HTTPException(status_code=404, detail="Folder not found")
        f.is_favorite = not f.is_favorite
        db.commit()
        db.refresh(f)
        return f
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@router.put("/{id}/restore")
def restore_folder_by_id(id: int, db: Session=Depends(get_db)):
    try:
        f = db.query(models.Folder).filter(models.Folder.id == id, models.Folder.is_deleted == True).first()
        if not f:
            raise HTTPException(status_code=404, detail="Folder not found")
        ids = get_subtree(id, db)
        
        db.query(models.Note).filter(models.Note.folder_id.in_(ids)).update({
            "is_deleted" : False,
            "deleted_at" : None
        }, synchronize_session=False)

        # 3. Khôi phục toàn bộ Folder bên trong nhánh này
        db.query(models.Folder).filter(models.Folder.id.in_(ids)).update({
            "is_deleted" : False,
            "deleted_at" : None
        }, synchronize_session=False)
        
        db.commit()
        db.refresh(f)
        return f
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
