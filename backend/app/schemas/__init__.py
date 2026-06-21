from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr


# === Auth ===
class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: Optional[str] = None
    company: Optional[str] = None

    class Config:
        from_attributes = True


# === Projects ===
class ProjectCreate(BaseModel):
    name: str


class ProjectResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# === Drawings ===
class DrawingResponse(BaseModel):
    id: str
    project_id: str
    sheet_name: str
    revision: str
    file_url: str
    uploaded_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class Coordinates(BaseModel):
    x: float
    y: float
    width: Optional[float] = None
    height: Optional[float] = None


class ChangeResponse(BaseModel):
    id: str
    drawing_id: str
    previous_revision: str
    change_type: str
    coordinates: Optional[Coordinates] = None
    trade: str
    severity: str
    description: Optional[str] = None
    confidence: float = 0.0

    class Config:
        from_attributes = True


class DiffResponse(BaseModel):
    sheet_id: str
    changes: List[ChangeResponse]
    summary: str


class TimelineEntry(BaseModel):
    id: str
    revision: str
    created_at: datetime
    change_count: int
    uploaded_by: str


# === Alerts ===
class SubscribeRequest(BaseModel):
    project_id: str
    trade: str
    webhook_url: Optional[str] = None
    email: Optional[str] = None


class AlertSubscriptionResponse(BaseModel):
    id: str
    project_id: str
    trade: str
    webhook_url: Optional[str] = None
    email: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    change_id: str
    title: str
    message: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# === Query ===
class QueryRequest(BaseModel):
    query: str


class QueryResponse(BaseModel):
    answer: str
    relevant_changes: List[ChangeResponse] = []
    explanation: str = ""
