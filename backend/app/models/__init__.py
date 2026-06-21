import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


def new_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=new_id)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    company = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=new_id)
    name = Column(String, nullable=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    owner = relationship("User", backref="projects")
    drawings = relationship("Drawing", back_populates="project", cascade="all, delete-orphan")


class Drawing(Base):
    __tablename__ = "drawings"

    id = Column(String, primary_key=True, default=new_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    sheet_name = Column(String, nullable=False)
    revision = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    file_hash = Column(String, nullable=True)
    page_count = Column(Integer, default=1)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    project = relationship("Project", back_populates="drawings")
    uploader = relationship("User")
    changes = relationship("Change", back_populates="drawing", cascade="all, delete-orphan")


class Change(Base):
    __tablename__ = "changes"

    id = Column(String, primary_key=True, default=new_id)
    drawing_id = Column(String, ForeignKey("drawings.id"), nullable=False)
    previous_revision = Column(String, nullable=False)
    change_type = Column(String, nullable=False)
    coordinates = Column(JSON, nullable=True)
    trade = Column(String, nullable=False)
    severity = Column(String, nullable=False, default="medium")
    description = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    drawing = relationship("Drawing", back_populates="changes")


class AlertSubscription(Base):
    __tablename__ = "alert_subscriptions"

    id = Column(String, primary_key=True, default=new_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    trade = Column(String, nullable=False)
    webhook_url = Column(String, nullable=True)
    email = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=new_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    change_id = Column(String, ForeignKey("changes.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class OAuthToken(Base):
    __tablename__ = "oauth_tokens"

    id = Column(String, primary_key=True, default=new_id)
    user_id = Column(String, nullable=False, index=True)
    provider = Column(String, nullable=False)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    scopes = Column(String, nullable=True)
    connected = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class OAuthState(Base):
    __tablename__ = "oauth_states"

    id = Column(String, primary_key=True, default=new_id)
    state = Column(String, unique=True, nullable=False, index=True)
    provider = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
