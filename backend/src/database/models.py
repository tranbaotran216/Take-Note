from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from datetime import datetime
from .database import base
from sqlalchemy.orm import relationship
from pydantic import BaseModel

class Note(base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)

class Folder(base):
    __tablename__ = "folders"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    parent_id = Column(Integer, ForeignKey("folders.id"), nullable=True)

    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)

class FolderCreate(BaseModel):
    name: str

class FolderUpdate(BaseModel):
    folder_id: int

class NoteCreate(BaseModel):
    title: str
    content: str

class ChatHistory(base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False )
    created_at = Column(DateTime, default=datetime.now)

    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)


class ChatRequest(BaseModel):
    content: str
    role: str