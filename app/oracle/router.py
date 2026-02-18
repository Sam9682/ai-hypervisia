"""Oracle AI router"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.events.dependencies import require_admin
from app.models.user import User
from app.oracle.schemas import (
    OracleQuery,
    OracleResponse,
    OracleHistoryItem,
    OracleAnalysisRequest,
    ForumAnalysisResponse
)
from app.oracle.service import OracleService
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.middleware.rate_limit import limiter

router = APIRouter(prefix="/api/oracle", tags=["oracle"])


@router.post("/ask", response_model=OracleResponse)
@limiter.limit("10/minute")
async def ask_oracle(
    query: OracleQuery,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Poser une question à l'Oracle AI
    
    - Supporte plusieurs fournisseurs d'IA: kiro (défaut), shai, openai
    - Historique sauvegardé pour les utilisateurs connectés
    - Rate limited à 10 requêtes par minute
    """
    try:
        user_id = current_user.id if current_user else None
        response = await OracleService.ask_oracle(db, query, user_id)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la consultation de l'Oracle: {str(e)}"
        )


@router.get("/history", response_model=List[OracleHistoryItem])
async def get_oracle_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupérer l'historique des questions posées à l'Oracle
    
    - Limité aux questions de l'utilisateur connecté
    - Maximum 50 résultats par défaut
    """
    try:
        history = OracleService.get_history(db, current_user.id, limit)
        return history
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération de l'historique: {str(e)}"
        )


@router.get("/history/all", response_model=List[OracleHistoryItem])
async def get_all_oracle_history(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Récupérer tout l'historique des questions (admin uniquement)
    
    - Accessible uniquement aux administrateurs
    - Maximum 100 résultats par défaut
    """
    try:
        history = OracleService.get_history(db, None, limit)
        return history
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération de l'historique: {str(e)}"
        )


@router.post("/analyze/forum", response_model=ForumAnalysisResponse)
@limiter.limit("5/hour")
async def analyze_forum(
    request: OracleAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyser les messages du forum avec l'Oracle AI
    
    - Résumé des discussions
    - Prédiction de perte d'emplois à 5, 10 et 20 ans
    - Identification des sujets clés
    - Analyse de sentiment
    - Rate limited à 5 requêtes par heure (analyse coûteuse)
    """
    try:
        analysis = await OracleService.analyze_forum(db, request.ai_provider)
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'analyse du forum: {str(e)}"
        )


@router.get("/providers")
async def get_available_providers():
    """
    Liste des fournisseurs d'IA disponibles
    """
    return {
        "providers": [
            {
                "id": "kiro",
                "name": "Kiro AI",
                "description": "IA locale via kiro-cli (Ubuntu)",
                "default": True
            },
            {
                "id": "shai",
                "name": "Shai AI",
                "description": "IA d'OVH Cloud",
                "default": False
            },
            {
                "id": "openai",
                "name": "OpenAI",
                "description": "GPT-4 d'OpenAI",
                "default": False
            }
        ]
    }
