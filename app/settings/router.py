"""Application settings API endpoints (admin only)."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

from app.models import User
from app.events.dependencies import require_admin
from app.auth.dependencies import get_current_user
from app.settings.service import app_settings_service
from app.logging_config import get_logger

logger = get_logger("settings.router")

router = APIRouter(prefix="/api/settings", tags=["settings"])


class AppSettingsResponse(BaseModel):
    pdf_ttl_hours: int
    docs_shared_enabled: bool


class AppSettingsUpdateRequest(BaseModel):
    pdf_ttl_hours: Optional[int] = Field(None, ge=1, le=720, description="PDF TTL in hours (1-720)")
    docs_shared_enabled: Optional[bool] = Field(None, description="Whether docs/ folder is shared in Documents")


@router.get("", response_model=AppSettingsResponse)
async def get_settings(
    current_user: User = Depends(require_admin),
) -> AppSettingsResponse:
    """Get current application settings (admin only)."""
    data = app_settings_service.get_all()
    return AppSettingsResponse(**data)


@router.put("", response_model=AppSettingsResponse)
async def update_settings(
    body: AppSettingsUpdateRequest,
    current_user: User = Depends(require_admin),
) -> AppSettingsResponse:
    """Update application settings (admin only)."""
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun paramètre à mettre à jour",
        )
    logger.info(f"Admin {current_user.email} updating settings: {updates}")
    data = app_settings_service.update(updates)
    return AppSettingsResponse(**data)


from fastapi.responses import FileResponse
from pathlib import Path
from typing import List


class SharedFileItem(BaseModel):
    name: str
    path: str
    size: int
    is_directory: bool


class SharedFilesResponse(BaseModel):
    files: List[SharedFileItem]
    total: int
    enabled: bool


DOCS_DIR = Path("docs")


@router.get("/shared-files", response_model=SharedFilesResponse)
async def list_shared_files(
    subpath: str = "",
    current_user: User = Depends(get_current_user),
) -> SharedFilesResponse:
    """List files in the docs/ shared directory.

    Returns flat list of files in the given subpath of docs/.
    Only available when docs_shared_enabled is True.
    """
    enabled = app_settings_service.get("docs_shared_enabled")
    if not enabled:
        return SharedFilesResponse(files=[], total=0, enabled=False)

    target = DOCS_DIR / subpath
    if not target.exists() or not target.is_dir():
        return SharedFilesResponse(files=[], total=0, enabled=True)

    # Prevent path traversal
    try:
        target.resolve().relative_to(DOCS_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=400, detail="Chemin invalide")

    items: List[SharedFileItem] = []
    for entry in sorted(target.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
        rel_path = str(entry.relative_to(DOCS_DIR))
        items.append(SharedFileItem(
            name=entry.name,
            path=rel_path,
            size=entry.stat().st_size if entry.is_file() else 0,
            is_directory=entry.is_dir(),
        ))

    return SharedFilesResponse(files=items, total=len(items), enabled=True)


@router.get("/shared-files/download")
async def download_shared_file(
    filepath: str,
    current_user: User = Depends(get_current_user),
):
    """Download a file from the shared docs/ directory."""
    enabled = app_settings_service.get("docs_shared_enabled")
    if not enabled:
        raise HTTPException(status_code=403, detail="Le répertoire partagé est désactivé")

    target = DOCS_DIR / filepath
    # Prevent path traversal
    try:
        target.resolve().relative_to(DOCS_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=400, detail="Chemin invalide")

    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="Fichier introuvable")

    return FileResponse(
        path=str(target),
        filename=target.name,
        media_type="application/octet-stream",
    )
