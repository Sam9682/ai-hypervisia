"""Administration API endpoints"""
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.models import User, UserRole, AuditLog
from app.events.dependencies import require_admin
from app.admin.schemas import (
    RoleUpdateRequest,
    RoleUpdateResponse,
    MemberListResponse,
    MemberSummary,
    DeactivateMemberResponse,
    AuditLogEntry,
    AuditLogResponse
)
from app.auth.schemas import ErrorResponse
from app.logging_config import logger
from datetime import datetime, timezone

router = APIRouter(prefix="/api/admin", tags=["administration"])


@router.put(
    "/members/{member_id}/role",
    response_model=RoleUpdateResponse,
    status_code=status.HTTP_200_OK,
    responses={
        403: {"description": "Insufficient permissions - administrator role required"},
        404: {"description": "Member not found"},
        400: {"description": "Invalid role value"}
    }
)
async def update_member_role(
    member_id: UUID,
    role_data: RoleUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> RoleUpdateResponse:
    """Update a member's role.
    
    Validates Requirements 7.1, 7.2, 7.5:
    - Administrator can assign roles to members (7.1)
    - Restricts administrative functions to administrator role (7.2)
    - Logs action in audit log with timestamp and admin identity (7.5)
    
    Args:
        member_id: UUID of the member to update
        role_data: New role information
        current_user: Authenticated administrator
        db: Database session
        
    Returns:
        RoleUpdateResponse with updated user details
        
    Raises:
        HTTPException 403: If user is not an administrator
        HTTPException 404: If member not found
        HTTPException 400: If role value is invalid
    """
    # Fetch the member to update
    member = db.query(User).filter(User.id == member_id).first()
    if not member:
        logger.warning(
            f"Administrator {current_user.id} attempted to update role for "
            f"non-existent member {member_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorResponse.create(
                code="MEMBER_NOT_FOUND",
                message="Member not found",
                details={"member_id": str(member_id)}
            )
        )
    
    # Validate and convert role string to UserRole enum
    try:
        new_role = UserRole(role_data.role)
    except ValueError:
        logger.warning(
            f"Administrator {current_user.id} provided invalid role: {role_data.role}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse.create(
                code="INVALID_ROLE",
                message="Invalid role value",
                details={
                    "provided_role": role_data.role,
                    "valid_roles": ["visitor", "member", "administrator"]
                }
            )
        )
    
    # Store old role for audit log
    old_role = member.role
    
    # Update the member's role (Requirement 7.1)
    member.role = new_role
    member.updated_at = datetime.now(timezone.utc)
    
    # Create audit log entry (Requirement 7.5)
    audit_entry = AuditLog(
        admin_id=current_user.id,
        action="update_member_role",
        target_type="user",
        target_id=member.id,
        details={
            "old_role": old_role.value,
            "new_role": new_role.value,
            "member_email": member.email
        }
    )
    db.add(audit_entry)
    
    # Commit changes
    db.commit()
    db.refresh(member)
    
    logger.info(
        f"Administrator {current_user.id} ({current_user.email}) updated role for "
        f"member {member.id} ({member.email}) from {old_role.value} to {new_role.value}"
    )
    
    return RoleUpdateResponse(
        id=str(member.id),
        email=member.email,
        first_name=member.first_name,
        last_name=member.last_name,
        role=member.role.value,
        message="User role updated successfully"
    )



@router.get(
    "/members",
    response_model=MemberListResponse,
    status_code=status.HTTP_200_OK,
    responses={
        403: {"description": "Insufficient permissions - administrator role required"}
    }
)
async def list_members(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> MemberListResponse:
    """List all members with their roles and membership status.
    
    Validates Requirements 7.3:
    - Administrator can view all members with their roles and membership status
    
    Args:
        current_user: Authenticated administrator
        db: Database session
        
    Returns:
        MemberListResponse with list of all members
        
    Raises:
        HTTPException 403: If user is not an administrator
    """
    # Fetch all users from the database
    members = db.query(User).order_by(User.created_at.desc()).all()
    
    # Calculate membership status for each member
    member_summaries = []
    now = datetime.now(timezone.utc)
    
    for member in members:
        # Determine membership status
        if not member.is_email_verified:
            membership_status = "suspended"  # Unverified accounts are suspended
        elif member.membership_expires_at is None:
            membership_status = "active"  # No expiration means active (e.g., lifetime membership)
        else:
            # Ensure timezone-aware comparison
            expires_at = member.membership_expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            
            if expires_at > now:
                membership_status = "active"
            else:
                membership_status = "expired"
        
        member_summaries.append(
            MemberSummary(
                id=str(member.id),
                email=member.email,
                first_name=member.first_name,
                last_name=member.last_name,
                role=member.role.value,
                is_email_verified=member.is_email_verified,
                membership_expires_at=member.membership_expires_at,
                membership_status=membership_status,
                created_at=member.created_at
            )
        )
    
    logger.info(
        f"Administrator {current_user.id} ({current_user.email}) retrieved member list "
        f"with {len(member_summaries)} members"
    )
    
    return MemberListResponse(
        members=member_summaries,
        total=len(member_summaries)
    )



@router.put(
    "/members/{member_id}/deactivate",
    response_model=DeactivateMemberResponse,
    status_code=status.HTTP_200_OK,
    responses={
        403: {"description": "Insufficient permissions - administrator role required"},
        404: {"description": "Member not found"}
    }
)
async def deactivate_member(
    member_id: UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> DeactivateMemberResponse:
    """Deactivate a member account.
    
    Validates Requirements 7.4:
    - Administrator can deactivate member accounts
    - Revokes access while preserving historical data
    
    Deactivation strategy:
    - Sets is_email_verified to False (prevents login)
    - Sets membership_expires_at to current time (marks as expired)
    - Preserves all historical data (posts, payments, registrations)
    - Logs action in audit log
    
    Args:
        member_id: UUID of the member to deactivate
        current_user: Authenticated administrator
        db: Database session
        
    Returns:
        DeactivateMemberResponse with confirmation
        
    Raises:
        HTTPException 403: If user is not an administrator
        HTTPException 404: If member not found
    """
    # Fetch the member to deactivate
    member = db.query(User).filter(User.id == member_id).first()
    if not member:
        logger.warning(
            f"Administrator {current_user.id} attempted to deactivate "
            f"non-existent member {member_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorResponse.create(
                code="MEMBER_NOT_FOUND",
                message="Member not found",
                details={"member_id": str(member_id)}
            )
        )
    
    # Store old status for audit log
    old_verified = member.is_email_verified
    old_expires_at = member.membership_expires_at
    
    # Deactivate the member (Requirement 7.4)
    # Revoke access by marking email as unverified and expiring membership
    member.is_email_verified = False
    member.membership_expires_at = datetime.now(timezone.utc)
    member.updated_at = datetime.now(timezone.utc)
    
    # Note: We do NOT delete any related data (posts, payments, registrations)
    # This preserves historical data as required by 7.4
    
    # Create audit log entry (Requirement 7.5)
    audit_entry = AuditLog(
        admin_id=current_user.id,
        action="deactivate_member",
        target_type="user",
        target_id=member.id,
        details={
            "member_email": member.email,
            "old_is_email_verified": old_verified,
            "old_membership_expires_at": old_expires_at.isoformat() if old_expires_at else None,
            "new_is_email_verified": False,
            "new_membership_expires_at": member.membership_expires_at.isoformat()
        }
    )
    db.add(audit_entry)
    
    # Commit changes
    db.commit()
    db.refresh(member)
    
    logger.info(
        f"Administrator {current_user.id} ({current_user.email}) deactivated "
        f"member {member.id} ({member.email})"
    )
    
    return DeactivateMemberResponse(
        id=str(member.id),
        email=member.email,
        message="Member account deactivated successfully"
    )



@router.get(
    "/audit-log",
    response_model=AuditLogResponse,
    status_code=status.HTTP_200_OK,
    responses={
        403: {"description": "Insufficient permissions - administrator role required"}
    }
)
async def get_audit_log(
    admin_id: Optional[UUID] = Query(None, description="Filter by admin ID"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date (inclusive)"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date (inclusive)"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(50, ge=1, le=100, description="Number of entries per page"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> AuditLogResponse:
    """Get audit log with filtering and pagination.
    
    Validates Requirements 7.5:
    - Administrator can view audit log of all administrative actions
    - Supports filtering by admin, action type, and date range
    - Paginates results for efficient retrieval
    
    Args:
        admin_id: Optional filter by admin user ID
        action: Optional filter by action type (e.g., "update_member_role", "deactivate_member")
        start_date: Optional filter by start date (inclusive)
        end_date: Optional filter by end date (inclusive)
        page: Page number (1-indexed)
        page_size: Number of entries per page (max 100)
        current_user: Authenticated administrator
        db: Database session
        
    Returns:
        AuditLogResponse with paginated audit log entries
        
    Raises:
        HTTPException 403: If user is not an administrator
    """
    # Build query with filters
    query = db.query(AuditLog)
    
    # Apply filters
    filters = []
    if admin_id is not None:
        filters.append(AuditLog.admin_id == admin_id)
    if action is not None:
        filters.append(AuditLog.action == action)
    if start_date is not None:
        # Ensure timezone-aware comparison
        if start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=timezone.utc)
        filters.append(AuditLog.timestamp >= start_date)
    if end_date is not None:
        # Ensure timezone-aware comparison
        if end_date.tzinfo is None:
            end_date = end_date.replace(tzinfo=timezone.utc)
        filters.append(AuditLog.timestamp <= end_date)
    
    if filters:
        query = query.filter(and_(*filters))
    
    # Get total count before pagination
    total = query.count()
    
    # Apply pagination and ordering (most recent first)
    offset = (page - 1) * page_size
    audit_entries = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(page_size).all()
    
    # Build response with denormalized admin email for convenience
    entries = []
    for entry in audit_entries:
        # Fetch admin email if admin_id exists
        admin_email = None
        if entry.admin_id:
            admin = db.query(User).filter(User.id == entry.admin_id).first()
            if admin:
                admin_email = admin.email
        
        entries.append(
            AuditLogEntry(
                id=str(entry.id),
                admin_id=str(entry.admin_id) if entry.admin_id else None,
                admin_email=admin_email,
                action=entry.action,
                target_type=entry.target_type,
                target_id=str(entry.target_id) if entry.target_id else None,
                details=entry.details,
                timestamp=entry.timestamp
            )
        )
    
    logger.info(
        f"Administrator {current_user.id} ({current_user.email}) retrieved audit log "
        f"(page {page}, {len(entries)} entries, {total} total)"
    )
    
    return AuditLogResponse(
        entries=entries,
        total=total,
        page=page,
        page_size=page_size
    )
