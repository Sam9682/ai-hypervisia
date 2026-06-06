"""Tests for app/courses/prompt_builder.py"""

import pytest

from app.courses.prompt_builder import (
    LATEX_CONSTRAINTS,
    SYSTEM_PROMPT,
    VALID_AUDIENCES,
    build_adaptation_prompt,
)


SAMPLE_TEX = r"""
\documentclass{article}
\usepackage{amsmath, amssymb, amsthm}
\begin{document}
\begin{theorem}
Soit $f$ une fonction continue sur $[a,b]$. Alors $f$ est intégrable sur $[a,b]$.
\end{theorem}
\begin{proof}
Démonstration par compacité.
\end{proof}
\end{document}
"""


class TestBuildAdaptationPrompt:
    """Test build_adaptation_prompt function."""

    def test_invalid_audience_raises_value_error(self):
        """Reject unknown audience levels."""
        with pytest.raises(ValueError, match="Niveau d'audience invalide"):
            build_adaptation_prompt("content", "invalid_level")

    def test_includes_full_tex_content_without_truncation(self):
        """Requirement 9.1: include the complete .tex source without truncation."""
        result = build_adaptation_prompt(SAMPLE_TEX, "licence")
        assert SAMPLE_TEX in result

    def test_includes_system_prompt(self):
        """System prompt with pedagogy expert role is present."""
        result = build_adaptation_prompt(SAMPLE_TEX, "licence")
        assert "[SYSTEM]" in result
        assert SYSTEM_PROMPT in result

    def test_includes_french_language_directive(self):
        """Requirement 9.7: directive requiring French language."""
        result = build_adaptation_prompt(SAMPLE_TEX, "licence")
        assert "intégralement en français" in result

    def test_includes_latex_constraints(self):
        """Requirement 9.3: preserve math environments and packages."""
        result = build_adaptation_prompt(SAMPLE_TEX, "licence")
        assert "theorem" in result
        assert "definition" in result
        assert "proof" in result
        assert "equation" in result
        assert "align" in result
        assert "amsmath" in result
        assert "amssymb" in result
        assert "amsthm" in result

    def test_includes_level_directives_section(self):
        """Requirement 9.2: adaptation instructions are present."""
        result = build_adaptation_prompt(SAMPLE_TEX, "licence")
        assert "[DIRECTIVES DE NIVEAU]" in result
        assert "Vocabulaire" in result
        assert "Détail" in result
        assert "Exemples" in result

    @pytest.mark.parametrize("audience", ["seconde", "terminale"])
    def test_seconde_terminale_directives(self, audience: str):
        """Requirement 9.4: intuitive justifications, numerical examples, accessible vocab."""
        result = build_adaptation_prompt(SAMPLE_TEX, audience)
        assert "justifications intuitives" in result
        assert "exemple numérique" in result
        assert "vocabulaire accessible" in result
        assert "jargon universitaire" in result.lower() or "jargon" in result

    @pytest.mark.parametrize("audience", ["professeur", "chercheur"])
    def test_professeur_chercheur_directives(self, audience: str):
        """Requirement 9.5: complete proofs, bibliography, formal terminology."""
        result = build_adaptation_prompt(SAMPLE_TEX, audience)
        assert "preuves complètes" in result
        assert "références bibliographiques" in result
        assert "terminologie formelle" in result

    @pytest.mark.parametrize("audience", ["licence", "master", "ingenieur"])
    def test_licence_master_ingenieur_directives(self, audience: str):
        """Requirement 9.6: proofs with explanations, application examples, university vocab."""
        result = build_adaptation_prompt(SAMPLE_TEX, audience)
        assert "explications intermédiaires" in result
        assert "exemples d'application" in result
        assert "niveau universitaire" in result

    def test_all_valid_audiences_accepted(self):
        """All 7 audience levels produce a valid prompt."""
        for audience in VALID_AUDIENCES:
            result = build_adaptation_prompt("test content", audience)
            assert len(result) > 0

    def test_prompt_structure_order(self):
        """Prompt sections appear in the correct order: SYSTEM, DIRECTIVES, CONTRAINTES, CONTENU."""
        result = build_adaptation_prompt(SAMPLE_TEX, "licence")
        system_pos = result.index("[SYSTEM]")
        directives_pos = result.index("[DIRECTIVES DE NIVEAU]")
        constraints_pos = result.index("[CONTRAINTES LATEX]")
        content_pos = result.index("[CONTENU SOURCE]")
        assert system_pos < directives_pos < constraints_pos < content_pos

    def test_empty_tex_content_is_included(self):
        """An empty tex_content string is still included (no truncation)."""
        result = build_adaptation_prompt("", "seconde")
        assert "[CONTENU SOURCE]" in result
