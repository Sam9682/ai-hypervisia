"""Forum API endpoints

This module provides REST API endpoints for forum functionality including
topics and posts. All endpoints require authenticated member access.

Validates Requirements 3.1, 3.2, 3.3, 3.4
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Topic, Post
from app.forum.dependencies import get_verified_member, get_administrator
from app.forum.schemas import (
    TopicCreate,
    TopicResponse,
    TopicDetailResponse,
    PostCreate,
    PostResponse
)
from app.auth.schemas import ErrorResponse
from app.logging_config import logger


router = APIRouter(prefix="/api/forum", tags=["forum"])


@router.get("/topics", response_model=list[TopicResponse])
async def list_topics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_member)
):
    """List all forum topics.
    
    Requires authenticated member access (Requirement 3.4).
    Returns all topics with author information (Requirement 3.1).
    
    Args:
        db: Database session
        current_user: Authenticated and verified member
        
    Returns:
        List of forum topics with metadata
    """
    logger.info(f"User {current_user.id} listing forum topics")
    
    # Query topics with post count
    topics = db.query(
        Topic,
        func.count(Post.id).label('post_count')
    ).outerjoin(
        Post, Topic.id == Post.topic_id
    ).group_by(
        Topic.id
    ).order_by(
        Topic.is_pinned.desc(),
        Topic.created_at.desc()
    ).all()
    
    # Build response with author names
    result = []
    for topic, post_count in topics:
        author = db.query(User).filter(User.id == topic.author_id).first()
        author_name = f"{author.first_name} {author.last_name}" if author else "Unknown"
        
        result.append(TopicResponse(
            id=topic.id,
            title=topic.title,
            author_id=topic.author_id,
            author_name=author_name,
            is_pinned=topic.is_pinned,
            is_locked=topic.is_locked,
            created_at=topic.created_at,
            updated_at=topic.updated_at,
            post_count=post_count
        ))
    
    return result


@router.post("/topics", response_model=TopicResponse, status_code=status.HTTP_201_CREATED)
async def create_topic(
    topic_data: TopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_member)
):
    """Create a new forum topic.
    
    Requires authenticated member access (Requirement 3.4).
    Associates topic with authenticated user (Requirement 3.2).
    
    Args:
        topic_data: Topic creation data
        db: Database session
        current_user: Authenticated and verified member
        
    Returns:
        Created topic with metadata
    """
    logger.info(f"User {current_user.id} creating topic: {topic_data.title}")
    
    # Create new topic
    new_topic = Topic(
        title=topic_data.title,
        author_id=current_user.id,
        is_pinned=False,
        is_locked=False
    )
    
    db.add(new_topic)
    db.commit()
    db.refresh(new_topic)
    
    author_name = f"{current_user.first_name} {current_user.last_name}"
    
    return TopicResponse(
        id=new_topic.id,
        title=new_topic.title,
        author_id=new_topic.author_id,
        author_name=author_name,
        is_pinned=new_topic.is_pinned,
        is_locked=new_topic.is_locked,
        created_at=new_topic.created_at,
        updated_at=new_topic.updated_at,
        post_count=0
    )


@router.get("/topics/{topic_id}", response_model=TopicDetailResponse)
async def get_topic(
    topic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_member)
):
    """Get a specific topic with all its posts.
    
    Requires authenticated member access (Requirement 3.4).
    Returns posts with author and timestamp (Requirement 3.6).
    Posts are ordered chronologically (Requirement 3.3).
    
    Args:
        topic_id: UUID of the topic
        db: Database session
        current_user: Authenticated and verified member
        
    Returns:
        Topic details with all posts
        
    Raises:
        HTTPException 404: If topic not found
    """
    from uuid import UUID
    
    try:
        topic_uuid = UUID(topic_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse.create(
                code="INVALID_TOPIC_ID",
                message="Invalid topic ID format",
                details={}
            )
        )
    
    # Fetch topic
    topic = db.query(Topic).filter(Topic.id == topic_uuid).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorResponse.create(
                code="TOPIC_NOT_FOUND",
                message="Topic not found",
                details={"topic_id": topic_id}
            )
        )
    
    # Fetch posts ordered chronologically (Requirement 3.3)
    posts = db.query(Post).filter(
        Post.topic_id == topic_uuid,
        Post.is_hidden == False  # Don't show hidden posts to regular users
    ).order_by(Post.created_at.asc()).all()
    
    # Build response with author names
    topic_author = db.query(User).filter(User.id == topic.author_id).first()
    topic_author_name = f"{topic_author.first_name} {topic_author.last_name}" if topic_author else "Unknown"
    
    post_responses = []
    for post in posts:
        post_author = db.query(User).filter(User.id == post.author_id).first()
        post_author_name = f"{post_author.first_name} {post_author.last_name}" if post_author else "Unknown"
        
        post_responses.append(PostResponse(
            id=post.id,
            topic_id=post.topic_id,
            author_id=post.author_id,
            author_name=post_author_name,
            content=post.content,
            is_hidden=post.is_hidden,
            created_at=post.created_at,
            updated_at=post.updated_at
        ))
    
    return TopicDetailResponse(
        id=topic.id,
        title=topic.title,
        author_id=topic.author_id,
        author_name=topic_author_name,
        is_pinned=topic.is_pinned,
        is_locked=topic.is_locked,
        created_at=topic.created_at,
        updated_at=topic.updated_at,
        post_count=len(post_responses),
        posts=post_responses
    )


@router.post("/topics/{topic_id}/posts", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    topic_id: str,
    post_data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_member)
):
    """Add a reply to a topic.
    
    Requires authenticated member access (Requirement 3.4).
    Associates post with authenticated user (Requirement 3.3).
    
    Args:
        topic_id: UUID of the topic
        post_data: Post creation data
        db: Database session
        current_user: Authenticated and verified member
        
    Returns:
        Created post with metadata
        
    Raises:
        HTTPException 404: If topic not found
        HTTPException 403: If topic is locked
    """
    from uuid import UUID
    
    try:
        topic_uuid = UUID(topic_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse.create(
                code="INVALID_TOPIC_ID",
                message="Invalid topic ID format",
                details={}
            )
        )
    
    # Check if topic exists
    topic = db.query(Topic).filter(Topic.id == topic_uuid).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorResponse.create(
                code="TOPIC_NOT_FOUND",
                message="Topic not found",
                details={"topic_id": topic_id}
            )
        )
    
    # Check if topic is locked
    if topic.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ErrorResponse.create(
                code="TOPIC_LOCKED",
                message="Cannot post to a locked topic",
                details={"topic_id": topic_id}
            )
        )
    
    logger.info(f"User {current_user.id} posting to topic {topic_id}")
    
    # Create new post
    new_post = Post(
        topic_id=topic_uuid,
        author_id=current_user.id,
        content=post_data.content,
        is_hidden=False
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    author_name = f"{current_user.first_name} {current_user.last_name}"
    
    return PostResponse(
        id=new_post.id,
        topic_id=new_post.topic_id,
        author_id=new_post.author_id,
        author_name=author_name,
        content=new_post.content,
        is_hidden=new_post.is_hidden,
        created_at=new_post.created_at,
        updated_at=new_post.updated_at
    )
