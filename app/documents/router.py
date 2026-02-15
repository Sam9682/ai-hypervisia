"""Document management API endpoints
Feature: hypervisia-website
Validates Requirements 5.1, 5.2, 5.3, 5.4, 5.7
"""
import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Document
from app.models.document import DocumentCategory, AccessLevel
from app.forum.dependencies import get_administrator
from app.documents.schemas import (
    DocumentUploadResponse,
    DocumentResponse
)
from app.services.storage_service import storage_service
from app.auth.schemas import ErrorResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a document (admin only)",
    description="""
    Upload a document to the system.
    
    Validates Requirements 5.2, 5.6:
    - Stores document and creates metadata record
    - Validates file size (max 10MB) and mime types
    - Assigns category and access permissions
    
    Only administrators can upload documents.
    """
)
async def upload_document(
    file: Annotated[UploadFile, File(description="Document file to upload")],
    category: Annotated[DocumentCategory, Form(description="Document category")],
    access_level: Annotated[AccessLevel, Form(description="Access level for document")],
    current_user: User = Depends(get_administrator),
    db: Session = Depends(get_db)
) -> DocumentUploadResponse:
    """Upload a document (admin only)
    
    Validates Requirements 5.2:
    - Administrator uploads document
    - System stores file and creates metadata
    - Assigns category and access permissions
    
    Args:
        file: Uploaded file
        category: Document category
        access_level: Access level for document
        current_user: Authenticated administrator
        db: Database session
    
    Returns:
        DocumentUploadResponse with document details
    
    Raises:
        HTTPException 400: If file validation fails
        HTTPException 403: If user is not administrator
    """
    logger.info(
        f"Document upload initiated by user {current_user.id}: "
        f"filename={file.filename}, category={category}, access_level={access_level}"
    )
    
    # Read file content
    try:
        file_content = await file.read()
        file_size = len(file_content)
    except Exception as e:
        logger.error(f"Failed to read uploaded file: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse.create(
                code="FILE_READ_ERROR",
                message="Failed to read uploaded file",
                details={"error": str(e)}
            )
        )
    
    # Validate file
    is_valid, error_message = storage_service.validate_file(
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream"
    )
    
    if not is_valid:
        logger.warning(
            f"File validation failed for {file.filename}: {error_message}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse.create(
                code="INVALID_FILE",
                message=error_message,
                details={
                    "filename": file.filename,
                    "size": file_size,
                    "mime_type": file.content_type
                }
            )
        )
    
    # Save file to storage
    try:
        unique_filename, file_path = storage_service.save_file(
            file_content=file_content,
            original_filename=file.filename
        )
    except Exception as e:
        logger.error(f"Failed to save file: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse.create(
                code="FILE_SAVE_ERROR",
                message="Failed to save file to storage",
                details={"error": str(e)}
            )
        )
    
    # Create document record in database
    try:
        document = Document(
            filename=unique_filename,
            original_name=file.filename,
            mime_type=file.content_type or "application/octet-stream",
            size=file_size,
            category=category,
            access_level=access_level,
            uploaded_by=current_user.id,
            download_count=0
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        logger.info(
            f"Document created successfully: id={document.id}, "
            f"filename={unique_filename}"
        )
        
        return DocumentUploadResponse(
            success=True,
            message="Document uploaded successfully",
            document=DocumentResponse.model_validate(document)
        )
    
    except Exception as e:
        db.rollback()
        # Clean up uploaded file if database operation fails
        storage_service.delete_file(unique_filename)
        logger.error(
            f"Failed to create document record: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse.create(
                code="DATABASE_ERROR",
                message="Failed to create document record",
                details={"error": str(e)}
            )
        )
