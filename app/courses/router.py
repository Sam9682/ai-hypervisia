"""Course Generator API router.

Provides endpoints for listing available courses, generating adapted
LaTeX courses via AI with PDF compilation, and downloading generated PDFs.

Requirements: 7.1, 7.2, 7.3, 7.4, 6.1, 6.4, 6.5, 6.6
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse

from app.auth.dependencies import get_current_user
from app.courses.schemas import (
    CourseListResponse,
    GenerateCourseRequest,
    GenerateResponse,
)
from app.courses.service import course_service
from app.logging_config import get_logger
from app.middleware.rate_limit import limiter
from app.models.user import User

logger = get_logger("courses.router")

router = APIRouter(prefix="/api/courses", tags=["courses"])


def _get_user_id_key(request: Request) -> str:
    """Rate limit key function based on authenticated user_id.

    Extracts user_id from the request state set by the endpoint dependency.
    Falls back to remote address if user_id is not available (should not
    happen on authenticated endpoints).
    """
    # The user object is resolved by the dependency injection before
    # the rate limiter checks, but slowapi key functions only receive
    # the Request. We extract the user from the authorization header
    # synchronously via a lightweight approach: store user_id in
    # request state from the endpoint, or parse the token here.
    # Since slowapi evaluates the key func before dependencies resolve,
    # we parse the JWT subject claim directly from the Authorization header.
    from app.auth.token import verify_token

    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        payload = verify_token(token)
        if payload and payload.get("sub"):
            return str(payload["sub"])

    # Fallback (should not be reached on authenticated endpoints)
    from slowapi.util import get_remote_address

    return get_remote_address(request)


@router.get("/list", response_model=CourseListResponse)
async def list_courses(
    current_user: User = Depends(get_current_user),
) -> CourseListResponse:
    """List available courses from docs/cours/.

    Returns all subdirectories containing at least one .tex file,
    sorted alphabetically with formatted display names.

    Requires valid JWT authentication.
    """
    courses = course_service.list_courses()
    return CourseListResponse(courses=courses, total=len(courses))


@router.post("/generate", response_model=GenerateResponse)
@limiter.limit("5/hour", key_func=_get_user_id_key)
async def generate_course(
    request: Request,
    body: GenerateCourseRequest,
    current_user: User = Depends(get_current_user),
) -> GenerateResponse:
    """Generate an adapted course for the target audience.

    Calls the AI provider to adapt the LaTeX source, then compiles
    the result into a downloadable PDF.

    Rate limited to 5 generations per 60-minute sliding window per user.

    Requires valid JWT authentication.
    """
    user_id = str(current_user.id)

    # Step 1: Generate adapted LaTeX via AI
    try:
        latex_content = await course_service.generate_course(
            course_name=body.course_name,
            audience=body.audience,
            ai_provider=body.ai_provider,
            user_id=user_id,
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except TimeoutError as e:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du cours : {e}",
        )

    # Step 2: Compile LaTeX to PDF
    try:
        download_id, filename, expires_at = await course_service.compile_pdf(
            latex_content=latex_content,
            course_name=body.course_name,
            audience=body.audience,
            user_id=user_id,
        )
    except RuntimeError as e:
        # Compilation failure — return 422 with compiler error
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erreur de compilation LaTeX : {e}",
        )
    except TimeoutError as e:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(e),
        )

    return GenerateResponse(
        download_id=download_id,
        latex_content=latex_content,
        course_name=body.course_name,
        audience=body.audience,
        ai_provider=body.ai_provider,
        filename=filename,
        expires_at=expires_at,
    )


@router.get("/download/{download_id}")
async def download_pdf(
    download_id: str,
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    """Download a generated PDF by its download_id.

    Validates that the requesting user owns the PDF and that the
    file has not expired (1-hour TTL).

    Requires valid JWT authentication.

    Returns the PDF file with Content-Disposition: attachment header.
    """
    user_id = str(current_user.id)

    try:
        file_path, filename = course_service.get_pdf(download_id, user_id)
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à télécharger ce fichier",
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
