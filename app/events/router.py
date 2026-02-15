"""Event management API endpoints
Feature: hypervisia-website
Validates Requirements 6.2, 10.3
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Event, EventStatus, NotificationPreferences, UserRole
from app.events.schemas import EventCreateRequest, EventCreateResponse, EventResponse
from app.events.dependencies import require_admin
from app.services.email_service import email_service
from app.auth.schemas import ErrorResponse
from app.logging_config import logger


router = APIRouter(prefix="/api/events", tags=["events"])


@router.post("", response_model=EventCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new event (admin only)
    
    Validates Requirements 6.2, 10.3:
    - Creates event with validated data (dates, location, description)
    - Stores event with all details
    - Sends notification to all members with event notifications enabled
    
    Args:
        event_data: Event creation data
        db: Database session
        current_user: Authenticated administrator user
        
    Returns:
        EventCreateResponse with created event details
        
    Raises:
        HTTPException 403: If user is not an administrator
        HTTPException 400: If event data is invalid
    """
    try:
        # Create event
        new_event = Event(
            title=event_data.title,
            description=event_data.description,
            start_date=event_data.start_date,
            end_date=event_data.end_date,
            location=event_data.location,
            max_participants=event_data.max_participants,
            created_by=current_user.id,
            status=EventStatus.SCHEDULED
        )
        
        db.add(new_event)
        db.commit()
        db.refresh(new_event)
        
        logger.info(
            f"Event created: {new_event.id} - {new_event.title} "
            f"by admin {current_user.id} ({current_user.email})"
        )
        
        # Send notifications to all members with event notifications enabled
        # Query all members (not visitors) with event notifications enabled
        members_to_notify = db.query(User).join(
            NotificationPreferences,
            User.id == NotificationPreferences.user_id,
            isouter=True
        ).filter(
            User.role.in_([UserRole.MEMBER, UserRole.ADMINISTRATOR]),
            User.is_email_verified == True,
            # If preferences exist, check event_notifications; if not, default to True
            (NotificationPreferences.event_notifications == True) | 
            (NotificationPreferences.user_id == None)
        ).all()
        
        # Send email notifications
        notification_count = 0
        for member in members_to_notify:
            # Skip the creator (they already know about the event)
            if member.id == current_user.id:
                continue
            
            # Format dates for email
            start_date_str = new_event.start_date.strftime("%d/%m/%Y à %H:%M")
            end_date_str = new_event.end_date.strftime("%d/%m/%Y à %H:%M")
            
            # Prepare email content
            subject = f"Nouvel événement HYPERVISIA : {new_event.title}"
            
            body_text = f"""
Bonjour {member.first_name},

Un nouvel événement a été créé sur HYPERVISIA :

Titre : {new_event.title}
Date de début : {start_date_str}
Date de fin : {end_date_str}
Lieu : {new_event.location or 'Non spécifié'}

{new_event.description or ''}

Connectez-vous à votre compte HYPERVISIA pour vous inscrire à cet événement.

Cordialement,
L'équipe HYPERVISIA
"""
            
            body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background-color: #f9f9f9; }}
        .event-details {{ background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #1a1a1a; }}
        .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #888; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>HYPERVISIA</h1>
            <h2>Nouvel Événement</h2>
        </div>
        <div class="content">
            <p>Bonjour {member.first_name},</p>
            <p>Un nouvel événement a été créé sur HYPERVISIA :</p>
            
            <div class="event-details">
                <h3>{new_event.title}</h3>
                <p><strong>Date de début :</strong> {start_date_str}</p>
                <p><strong>Date de fin :</strong> {end_date_str}</p>
                <p><strong>Lieu :</strong> {new_event.location or 'Non spécifié'}</p>
                {f'<p><strong>Description :</strong></p><p>{new_event.description}</p>' if new_event.description else ''}
            </div>
            
            <p>Connectez-vous à votre compte HYPERVISIA pour vous inscrire à cet événement.</p>
            
            <p>Cordialement,<br>
            L'équipe HYPERVISIA</p>
        </div>
        <div class="footer">
            <p>Association HYPERVISIA - Loi 1901</p>
        </div>
    </div>
</body>
</html>
"""
            
            # Send email (don't fail event creation if email fails)
            try:
                email_sent = email_service.send_email(
                    to_email=member.email,
                    subject=subject,
                    body_text=body_text,
                    body_html=body_html
                )
                if email_sent:
                    notification_count += 1
            except Exception as e:
                logger.error(
                    f"Failed to send event notification to {member.email}: {str(e)}",
                    exc_info=True
                )
        
        logger.info(
            f"Sent {notification_count} event notifications for event {new_event.id}"
        )
        
        # Prepare response
        event_response = EventResponse(
            id=new_event.id,
            title=new_event.title,
            description=new_event.description,
            start_date=new_event.start_date,
            end_date=new_event.end_date,
            location=new_event.location,
            max_participants=new_event.max_participants,
            created_by=new_event.created_by,
            status=new_event.status.value,
            created_at=new_event.created_at,
            updated_at=new_event.updated_at,
            participant_count=0
        )
        
        return EventCreateResponse(
            success=True,
            message=f"Event created successfully. Notifications sent to {notification_count} members.",
            event=event_response
        )
    
    except ValueError as e:
        # Validation errors from Pydantic
        logger.warning(f"Event creation validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse.create(
                code="VALIDATION_ERROR",
                message=str(e),
                details={}
            )
        )
    except Exception as e:
        logger.error(f"Error creating event: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse.create(
                code="EVENT_CREATION_FAILED",
                message="Failed to create event",
                details={"error": str(e)}
            )
        )
