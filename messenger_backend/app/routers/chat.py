from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlmodel import Session, select
from ..db import get_session
from ..models import Conversation, ConversationMember, Message
from ..security import get_current_user

router = APIRouter(prefix="/conversations", tags=["conversations"])

class ConversationCreate(BaseModel):
    member_ids: List[int] = []
    title: Optional[str] = None
    is_group: bool = False

@router.get("", response_model=List[Conversation])
def list_conversations(session: Session = Depends(get_session),
                       user=Depends(get_current_user)):
    q = select(Conversation).join(ConversationMember,
         ConversationMember.conversation_id == Conversation.id
    ).where(ConversationMember.user_id == user.id)
    return session.exec(q).all()

@router.post("", response_model=Conversation)
def create_conversation(payload: ConversationCreate,
                        session: Session = Depends(get_session),
                        user=Depends(get_current_user)):
    conv = Conversation(is_group=payload.is_group, title=payload.title)
    session.add(conv); session.commit(); session.refresh(conv)
    # creator + weitere Member
    session.add(ConversationMember(conversation_id=conv.id, user_id=user.id, role="owner"))
    for uid in payload.member_ids:
        if uid != user.id:
            session.add(ConversationMember(conversation_id=conv.id, user_id=uid))
    session.commit()
    return conv

# Messages
class MessageIn(BaseModel):
    type: str = "text"
    content: Optional[str] = None
    media_url: Optional[str] = None

@router.get("/{conv_id}/messages", response_model=List[Message])
def list_messages(conv_id: int, limit: int = 50, session: Session = Depends(get_session),
                  user=Depends(get_current_user)):
    # Mitglieds-Check
    mem = session.get(ConversationMember, (conv_id, user.id))
    if not mem:
        raise HTTPException(403, "Not a member")
    q = select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at.desc()).limit(limit)
    return session.exec(q).all()

@router.post("/{conv_id}/messages", response_model=Message)
def send_message(conv_id: int, payload: MessageIn, session: Session = Depends(get_session),
                 user=Depends(get_current_user)):
    mem = session.get(ConversationMember, (conv_id, user.id))
    if not mem:
        raise HTTPException(403, "Not a member")
    msg = Message(conversation_id=conv_id, sender_id=user.id,
                  type=payload.type, content=payload.content, media_url=payload.media_url)
    session.add(msg); session.commit(); session.refresh(msg)
    return msg
