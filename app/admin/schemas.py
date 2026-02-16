"""Pydantic schemas for administration endpoints"""
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


class RoleUpdateRequest(BaseModel):
    """Request schema for updating user role
    
    Validates Requirements 7.1, 7.2:
    - Administrator can assign roles to members
    - Role must be valid (visitor, member, administrator)
    """
    role: str = Field(
        description="New role for the user",
        pattern="^(visitor|member|administrator)$"
    )


class RoleUpdateResponse(BaseModel):
    """Response schema for successful role update"""
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    message: str = "User role updated successfully"
    
    model_config = {
        "from_attributes": True
    }


class MemberSummary(BaseModel):
    """Summary information for a member
    
    Validates Requirements 7.3:
    - Displays all members with their roles and membership status
    """
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_email_verified: bool
    membership_expires_at: Optional[datetime]
    membership_status: str  # 'active', 'expired', 'suspended'
    created_at: datetime
    
    model_config = {
        "from_attributes": True
    }


class MemberListResponse(BaseModel):
    """Response schema for member list"""
    members: list[MemberSummary]
    total: int
    
    model_config = {
        "from_attributes": True
    }


class DeactivateMemberResponse(BaseModel):
    """Response schema for member deactivation"""
    id: str
    email: str
    message: str = "Member account deactivated successfully"
    
    model_config = {
        "from_attributes": True
    }


class AuditLogEntry(BaseModel):
    """Schema for a single audit log entry
    
    Validates Requirements 7.5:
    - Displays administrative actions with timestamp and admin identity
    """
    id: str
    admin_id: Optional[str]
    admin_email: Optional[str]  # Denormalized for convenience
    action: str
    target_type: Optional[str]
    target_id: Optional[str]
    details: Optional[dict[str, Any]]
    timestamp: datetime
    
    model_config = {
        "from_attributes": True
    }


class AuditLogResponse(BaseModel):
    """Response schema for audit log listing with pagination"""
    entries: list[AuditLogEntry]
    total: int
    page: int
    page_size: int
    
    model_config = {
        "from_attributes": True
    }


class ForumActivityStats(BaseModel):
    """Forum activity statistics"""
    topics: int = Field(description="Number of topics created in the period")
    posts: int = Field(description="Number of posts created in the period")


class ActivityReportResponse(BaseModel):
    """Response schema for activity report
    
    Validates Requirements 8.4:
    - Generates annual activity reports accessible to all members
    """
    period_start: datetime = Field(description="Start date of the reporting period")
    period_end: datetime = Field(description="End date of the reporting period")
    new_members: int = Field(description="Number of new members registered in the period")
    active_members: int = Field(description="Number of members with active membership status")
    events_held: int = Field(description="Number of events held in the period")
    forum_activity: ForumActivityStats = Field(description="Forum activity statistics")
    revenue: float = Field(description="Total revenue from payments in the period (in EUR)")
    
    model_config = {
        "from_attributes": True
    }
