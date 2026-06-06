"""
Prompt builder for course adaptation.

Constructs structured prompts for AI providers to adapt mathematical
LaTeX course content to a specific audience level.
"""

from typing import Dict


# System prompt establishing the AI's pedagogical role
SYSTEM_PROMPT = (
    "Tu es un expert en pédagogie des mathématiques, spécialisé dans l'adaptation "
    "de contenus académiques à différents niveaux d'audience. Tu maîtrises parfaitement "
    "le LaTeX et les conventions typographiques des publications mathématiques françaises."
)

# LaTeX constraints applied to all audience levels
LATEX_CONSTRAINTS = """[CONTRAINTES LATEX]
- Produire du LaTeX valide et compilable
- Répondre UNIQUEMENT avec le code LaTeX, sans balises markdown (pas de ```), sans texte explicatif avant ou après
- Le document doit commencer par \\documentclass et se terminer par \\end{document}
- Préserver les environnements mathématiques : theorem, definition, proof, equation, align
- Préserver les packages : amsmath, amssymb, amsthm
- Conserver la structure globale du document (sections, sous-sections)
- Rédiger intégralement en français"""

# Level-specific directives grouped by audience category
_SECONDE_TERMINALE_DIRECTIVES = """[DIRECTIVES DE NIVEAU]
- Vocabulaire : utiliser un vocabulaire accessible, sans jargon universitaire ni terminologie avancée
- Détail : remplacer les démonstrations formelles par des justifications intuitives et des explications pas à pas
- Exemples : ajouter au moins un exemple numérique concret par théorème ou propriété énoncée
- Remplacer les preuves rigoureuses par des arguments intuitifs illustrés
- Privilégier les représentations visuelles et les analogies concrètes
- Éviter toute notation abstraite non introduite explicitement"""

_LICENCE_MASTER_INGENIEUR_DIRECTIVES = """[DIRECTIVES DE NIVEAU]
- Vocabulaire : adapter la terminologie au niveau universitaire correspondant, avec introduction progressive des termes techniques
- Détail : conserver les démonstrations avec des explications intermédiaires détaillant chaque étape clé
- Exemples : ajouter des exemples d'application pour illustrer les résultats théoriques
- Maintenir la rigueur mathématique tout en explicitant les étapes de raisonnement
- Inclure des remarques pédagogiques pour les passages difficiles
- Relier les concepts aux applications concrètes du domaine"""

_PROFESSEUR_CHERCHEUR_DIRECTIVES = """[DIRECTIVES DE NIVEAU]
- Vocabulaire : utiliser la terminologie formelle du champ de recherche sans simplification
- Détail : développer les preuves complètes avec toutes les étapes intermédiaires et les arguments techniques
- Exemples : fournir des contre-exemples et des cas limites pour délimiter les résultats
- Ajouter au minimum 3 références bibliographiques pertinentes au domaine traité
- Inclure les généralisations et extensions possibles des résultats présentés
- Utiliser le style formel des publications de recherche mathématique"""

# Mapping from audience identifier to corresponding directives
_AUDIENCE_DIRECTIVES: Dict[str, str] = {
    "seconde": _SECONDE_TERMINALE_DIRECTIVES,
    "terminale": _SECONDE_TERMINALE_DIRECTIVES,
    "licence": _LICENCE_MASTER_INGENIEUR_DIRECTIVES,
    "master": _LICENCE_MASTER_INGENIEUR_DIRECTIVES,
    "ingenieur": _LICENCE_MASTER_INGENIEUR_DIRECTIVES,
    "professeur": _PROFESSEUR_CHERCHEUR_DIRECTIVES,
    "chercheur": _PROFESSEUR_CHERCHEUR_DIRECTIVES,
}

# Valid audience levels
VALID_AUDIENCES = frozenset(_AUDIENCE_DIRECTIVES.keys())


def build_adaptation_prompt(tex_content: str, audience: str) -> str:
    """
    Build a structured prompt for AI-based course adaptation.

    Constructs a complete prompt including system role, level-specific
    directives, LaTeX constraints, and the full source content.

    Args:
        tex_content: The complete .tex source content (included without truncation).
        audience: The target audience level. Must be one of:
            seconde, terminale, licence, master, ingenieur, professeur, chercheur.

    Returns:
        A fully structured prompt string ready to be sent to the AI provider.

    Raises:
        ValueError: If the audience level is not recognized.
    """
    if audience not in VALID_AUDIENCES:
        raise ValueError(
            f"Niveau d'audience invalide : '{audience}'. "
            f"Valeurs acceptées : {', '.join(sorted(VALID_AUDIENCES))}"
        )

    directives = _AUDIENCE_DIRECTIVES[audience]

    prompt = f"""[SYSTEM]
{SYSTEM_PROMPT}

{directives}

{LATEX_CONSTRAINTS}

[CONTENU SOURCE]
{tex_content}"""

    return prompt
