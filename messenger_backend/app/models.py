from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)          # unique im Code prüfen
    password_hash: str
    display_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Conversation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    is_group: bool = False
    title: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ConversationMember(SQLModel, table=True):
    conversation_id: int = Field(foreign_key="conversation.id", primary_key=True)
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    role: str = "member"
    joined_at: datetime = Field(default_factory=datetime.utcnow)

class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.id")
    sender_id: int = Field(foreign_key="user.id")
    type: str = "text"              # 'text' | 'image' | 'file'
    content: Optional[str] = None
    media_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
