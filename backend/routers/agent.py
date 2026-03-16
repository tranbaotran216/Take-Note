from fastapi import APIRouter, Depends, HTTPException
from ..src.database import models, database
from ..dependencies import get_db
from sqlalchemy.orm import Session
from ..src.database.models import ChatRequest, ChatHistory
import uuid
from ..rag.rag_answer import get_agent_respose

router = APIRouter(prefix="/chat", tags=["chat"])
@router.post("/")
def send_message(data: ChatRequest, db: Session = Depends(get_db)):
    try:
        res = get_agent_respose(data.content)
        session_id = str(uuid.uuid4())

        ask = ChatHistory(session_id=session_id, role=data.role, content=data.content)
        answer = ChatHistory(session_id=session_id, role="agent", content=res)
        db.add(ask)
        db.add(answer)
        db.commit()
        return {"reply": res}
    except FileNotFoundError as e:
        db.rollback()
        raise HTTPException(
            status_code=503, 
            detail=f"Agent unavailable: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))




