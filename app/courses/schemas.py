"""Course Generator schemas - Pydantic models for request/response validation"""
from dataclasses import dataclass
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


# --- Request Models ---


class GenerateCourseRequest(BaseModel):
    """Requête de génération de cours adapté"""

    course_name: str = Field(
        ..., min_length=1, max_length=200, description="Nom du sous-répertoire du cours"
    )
    audience: Literal[
        "seconde",
        "terminale",
        "licence",
        "master",
        "ingenieur",
        "professeur",
        "chercheur",
    ] = Field(..., description="Niveau d'audience cible")
    ai_provider: Literal["shai", "kiro", "openai"] = Field(
        default="shai", description="Fournisseur IA"
    )


# --- Response Models ---


class CourseItem(BaseModel):
    """Un cours disponible"""

    name: str  # Nom du répertoire (ex: "Automatique.Linéaire")
    display_name: str  # Nom formaté (ex: "Automatique Linéaire")
    has_pdf: bool  # Si le PDF source existe aussi


class CourseListResponse(BaseModel):
    """Liste des cours disponibles"""

    courses: List[CourseItem]
    total: int


class GenerateResponse(BaseModel):
    """Réponse de génération réussie"""

    download_id: str  # UUID pour télécharger le PDF
    latex_content: str  # Contenu LaTeX généré (pour visualisation/copie)
    course_name: str  # Nom du cours source
    audience: str  # Niveau d'audience utilisé
    ai_provider: str  # Provider utilisé
    filename: str  # Nom du fichier PDF généré
    expires_at: datetime  # Timestamp d'expiration du download


class GenerateErrorResponse(BaseModel):
    """Réponse d'erreur de génération"""

    error: str
    error_type: Literal["ai_error", "compilation_error", "timeout", "rate_limit"]
    details: Optional[str] = None  # Log compilateur tronqué (max 2000 chars)


# --- File Storage Model ---


@dataclass
class GeneratedPDF:
    """Métadonnées d'un PDF généré stocké sur disque"""

    download_id: str  # UUID unique
    user_id: str  # UUID de l'utilisateur propriétaire
    file_path: str  # Chemin absolu vers le fichier PDF
    filename: str  # Nom de fichier pour le download
    created_at: datetime  # Timestamp de création
    expires_at: datetime  # created_at + 1 heure
    course_name: str
    audience: str
