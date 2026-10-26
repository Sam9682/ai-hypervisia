"""
Prompt builder for course adaptation.

Constructs structured prompts for AI providers to adapt mathematical
LaTeX course content to a specific audience level.
"""

from typing import Dict


# System prompt establishing the AI's pedagogical role
SYSTEM_PROMPT = (
    "Tu es un expert en ingénierie pédagogique et en didactique des mathématiques et des sciences, "
    "spécialisé dans la restructuration de cours académiques selon une approche purement inductive. "
    "Ton rôle est de transformer des contenus descendants, théoriques et désincarnés en un parcours "
    "de découverte logique où chaque notion est une réponse nécessaire à un problème posé. "
    "Tu maîtrises parfaitement le LaTeX universitaire et les conventions typographiques françaises."
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

# Core pedagogical directives applied to ALL audience levels
CORE_PEDAGOGICAL_DIRECTIVES = """[PHILOSOPHIE PÉDAGOGIQUE OBLIGATOIRE]
Tu dois appliquer une approche INDUCTIVE stricte. Il est formellement INTERDIT de parachuter \
une notion, une formule ou un objet mathématique sans l'avoir motivé au préalable.

Pour chaque section ou concept introduit, tu dois respecter la dynamique suivante :

1. LE FIL CONDUCTEUR : Ne commence JAMAIS une section par une définition ou un théorème. \
Commence toujours par poser une question, un défi technique, ou une contradiction logique \
issue de ce qui précède.

2. DE LA RÉALITÉ À L'OUTIL : Pars d'une observation concrète (physique, ingénierie), \
d'un exemple numérique simple ou d'un verrou mathématique (une équation qu'on ne sait pas \
résoudre avec les outils actuels).

3. LA DÉDUCTION : Fais émerger l'outil mathématique comme la SEULE solution logique pour \
lever ce verrou. L'équation ou le théorème ne doit être que la traduction rigoureuse de la \
nécessité établie juste avant."""

# Level-specific directives grouped by audience category
_SECONDE_TERMINALE_DIRECTIVES = """[DIRECTIVES DE NIVEAU]
- Vocabulaire : Bannir le jargon universitaire (ex: préférer "fonction qui ne s'annule pas" à "morphisme injectif"). Vocabulaire accessible mais rigoureux.
- Amorce Inductive : Partir d'exemples géométriques visuels, de graphiques ou de problèmes de la vie courante/physique simple (vitesse, trajectoire).
- Rigueur vs Intuition : Remplacer les démonstrations formelles ou abstraites par des justifications intuitives, des animations textuelles pas à pas et des analogies concrètes.
- Applications : Ajouter obligatoirement un exemple numérique guidé ou une application concrète immédiatement après chaque nouvelle propriété pour ancrer le concept.
- Notations : Limiter les symboles abstraits non indispensables (éviter les successions de quantificateurs $\\forall, \\exists$ préférer les phrases en français)."""

_LICENCE_MASTER_INGENIEUR_DIRECTIVES = """[DIRECTIVES DE NIVEAU]
- Vocabulaire : Terminologie universitaire précise. Les termes techniques sont introduits en montrant leur puissance de conceptualisation.
- Amorce Inductive : Partir d'un problème d'ingénierie complexe, d'un système physique (ex: dynamique des fluides, asservissement) ou d'un besoin de généralisation mathématique (ex: passer de $\\mathbb{R}^2$ à $\\mathbb{R}^n$).
- Rigueur et Structure : Maintenir une rigueur mathématique totale. Les démonstrations doivent être complètes mais scénarisées : expliciter l'astuce ou le "pourquoi" de la méthode avant de dérouler le calcul.
- Interactivité : Insérer des "Remarques Pédagogiques" ou des alertes sur les pièges classiques et les erreurs d'interprétation physique des résultats mathématiques."""

_PROFESSEUR_CHERCHEUR_DIRECTIVES = """[DIRECTIVES DE NIVEAU]
- Vocabulaire : Formel, dense et hautement spécialisé. Aucune simplification de style.
- Amorce Inductive : Le "problème" de départ est ici un verrou conceptuel de recherche, un besoin de structure abstraite supérieure, une généralisation à des espaces topologiques ou algébriques complexes, ou une faille dans une théorie existante.
- Preuves et Limites : Développer les preuves de manière exhaustive avec toutes les étapes techniques. Introduire systématiquement des cas limites, des pathologies mathématiques et des contre-exemples pour délimiter précisément la portée des théorèmes.
- Écosystème : Proposer des extensions possibles (généralisations) et inclure en fin de document une section \\begin{{thebibliography}} contenant au moins 3 références académiques majeures (fictives mais réalistes ou réelles si adaptées) liées au sujet."""

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

{CORE_PEDAGOGICAL_DIRECTIVES}

{directives}

{LATEX_CONSTRAINTS}

[CONTENU SOURCE]
{tex_content}"""

    return prompt
