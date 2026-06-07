"""
Course Generator Service.

Handles course listing, AI-powered LaTeX adaptation, PDF compilation,
and temporary file storage with expiration management.
"""

import asyncio
import json
import re
import shutil
import subprocess
import tempfile
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional, Tuple

from app.courses.prompt_builder import build_adaptation_prompt
from app.courses.schemas import CourseItem, GeneratedPDF
from app.logging_config import get_logger
from app.oracle.ai_providers import get_ai_provider

logger = get_logger("courses.service")

# Base paths
DOCS_COURS_DIR = Path("docs/cours")
STORAGE_DIR = Path("storage/generated_pdfs")
INDEX_FILE = STORAGE_DIR / "index.json"

# Constants
PDF_EXPIRATION_HOURS = 1
AI_TIMEOUT_SECONDS = 1800
PDFLATEX_TIMEOUT_SECONDS = 1800
MAX_FILENAME_LENGTH = 100  # Including .pdf extension
COMPILER_ERROR_MAX_CHARS = 2000


class CourseService:
    """Service for course generation, PDF compilation, and file management."""

    def __init__(self) -> None:
        """Initialize the CourseService and ensure storage directory exists."""
        STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        if not INDEX_FILE.exists():
            self._write_index([])

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def list_courses(self) -> List[CourseItem]:
        """
        Scan docs/cours/ for subdirectories containing .tex files.

        Returns a sorted list of CourseItem with formatted display names
        (dots replaced by spaces). Returns an empty list if the directory
        is empty or inaccessible.
        """
        try:
            if not DOCS_COURS_DIR.exists():
                logger.warning(f"Course directory not found: {DOCS_COURS_DIR}")
                return []

            courses: List[CourseItem] = []
            for entry in DOCS_COURS_DIR.iterdir():
                if not entry.is_dir():
                    continue

                # Check if directory contains at least one .tex file
                tex_files = list(entry.glob("*.tex"))
                if not tex_files:
                    continue

                # Check if a PDF source exists
                has_pdf = any(entry.glob("*.pdf"))

                # Format display name: replace dots with spaces
                display_name = entry.name.replace(".", " ")

                courses.append(
                    CourseItem(
                        name=entry.name,
                        display_name=display_name,
                        has_pdf=has_pdf,
                    )
                )

            # Sort alphabetically by display name
            courses.sort(key=lambda c: c.display_name.lower())
            return courses

        except OSError as e:
            logger.error(f"Error scanning course directory: {e}")
            return []

    async def generate_course(
        self,
        course_name: str,
        audience: str,
        ai_provider: str,
        user_id: str,
        custom_context: Optional[str] = None,
    ) -> str:
        """
        Generate an adapted LaTeX course using AI.

        Reads the .tex file from the course directory, builds the adaptation
        prompt, and calls the AI provider.

        Args:
            course_name: Name of the course subdirectory in docs/cours/.
            audience: Target audience level.
            ai_provider: AI provider name (shai, kiro, openai).
            user_id: Authenticated user ID.
            custom_context: Optional user-provided additional context appended to the prompt.

        Returns:
            The adapted LaTeX content as a string.

        Raises:
            FileNotFoundError: If course directory or .tex file not found.
            TimeoutError: If AI provider exceeds 120s timeout.
            Exception: If AI provider returns an error.
        """
        # Locate the .tex file
        course_dir = DOCS_COURS_DIR / course_name
        if not course_dir.exists() or not course_dir.is_dir():
            raise FileNotFoundError(
                f"Cours introuvable : '{course_name}'"
            )

        tex_files = list(course_dir.glob("*.tex"))
        if not tex_files:
            raise FileNotFoundError(
                f"Aucun fichier .tex trouvé dans le cours '{course_name}'"
            )

        # Use the first .tex file found (typically the main one)
        tex_file = tex_files[0]
        logger.info(f"Reading tex file: {tex_file}")

        tex_content = tex_file.read_text(encoding="utf-8")
        logger.info(
            f"Tex file read successfully: {tex_file} "
            f"({len(tex_content)} chars, {len(tex_content.splitlines())} lines)"
        )

        # Build the adaptation prompt
        logger.info(
            f"Building adaptation prompt for course='{course_name}', "
            f"audience='{audience}', provider='{ai_provider}', user='{user_id}'"
        )
        prompt = build_adaptation_prompt(tex_content, audience)
        logger.info(
            f"Prompt built successfully ({len(prompt)} chars total)"
        )

        # Append user's custom context if provided
        if custom_context and custom_context.strip():
            prompt += f"\n\n[CONTEXTE PERSONNEL COMPLÉMENTAIRE]\n{custom_context.strip()}"
            logger.info(
                f"Custom context appended to prompt "
                f"({len(custom_context.strip())} chars, "
                f"new total: {len(prompt)} chars)"
            )

        # Save the prompt context to a traceable log file
        prompt_log_dir = Path("storage/prompt_logs")
        prompt_log_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        prompt_log_file = prompt_log_dir / f"{timestamp}_{course_name}_{audience}_{ai_provider}.txt"
        try:
            prompt_log_file.write_text(prompt, encoding="utf-8")
            logger.info(
                f"GenAI prompt context saved to: {prompt_log_file.resolve()} "
                f"(course='{course_name}', audience='{audience}', provider='{ai_provider}')"
            )
        except OSError as e:
            logger.warning(f"Could not save prompt log file: {e}")

        # Call the AI provider with timeout
        logger.info(
            f"Initializing AI provider '{ai_provider}' "
            f"(timeout={AI_TIMEOUT_SECONDS}s, max_tokens=8000)"
        )
        provider = get_ai_provider(ai_provider)
        logger.info(
            f"AI provider '{ai_provider}' initialized, sending query..."
        )

        try:
            result = await asyncio.wait_for(
                provider.query(
                    question=prompt,
                    context=None,
                    temperature=0.7,
                    max_tokens=8000,
                ),
                timeout=AI_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            logger.error(
                f"AI provider '{ai_provider}' timeout after {AI_TIMEOUT_SECONDS}s "
                f"for course '{course_name}' (user: {user_id})"
            )
            raise TimeoutError(
                f"Le fournisseur IA '{ai_provider}' n'a pas répondu dans le délai "
                f"de {AI_TIMEOUT_SECONDS} secondes"
            )
        except Exception as e:
            logger.error(
                f"AI provider '{ai_provider}' raised an exception for "
                f"course '{course_name}' (user: {user_id}): "
                f"{type(e).__name__}: {e}"
            )
            raise

        logger.info(
            f"AI provider '{ai_provider}' returned a result "
            f"(processing_time={result.get('processing_time', 'N/A')}s, "
            f"tokens_used={result.get('tokens_used', 'N/A')})"
        )

        latex_content = result.get("answer", "")
        if not latex_content:
            logger.error(
                f"AI provider '{ai_provider}' returned empty content for "
                f"course '{course_name}' (user: {user_id}). "
                f"Full result keys: {list(result.keys())}"
            )
            raise Exception(
                f"Le fournisseur IA '{ai_provider}' n'a retourné aucun contenu"
            )

        logger.info(
            f"AI response received: {len(latex_content)} chars. "
            f"Cleaning LaTeX response..."
        )

        # Clean AI response: extract pure LaTeX content
        latex_content = self._clean_latex_response(latex_content)

        logger.info(
            f"Course generated successfully: {course_name} for {audience} "
            f"via {ai_provider} (user: {user_id}, "
            f"final_latex_length={len(latex_content)} chars)"
        )
        return latex_content

    async def compile_pdf(
        self,
        latex_content: str,
        course_name: str,
        audience: str,
        user_id: str,
    ) -> Tuple[str, str, datetime]:
        """
        Compile LaTeX content to PDF.

        Writes a temporary .tex file, runs pdflatex, stores the resulting
        PDF in storage/generated_pdfs/, and creates a metadata entry.

        Args:
            latex_content: The LaTeX source to compile.
            course_name: Name of the source course.
            audience: Target audience level.
            user_id: Authenticated user ID (owner of the generated PDF).

        Returns:
            Tuple of (download_id, filename, expires_at).

        Raises:
            RuntimeError: If pdflatex compilation fails.
            TimeoutError: If compilation exceeds 120s timeout.
        """
        download_id = str(uuid.uuid4())
        filename = self._generate_filename(course_name, audience)

        # Create a temporary directory for compilation
        with tempfile.TemporaryDirectory(prefix="course_compile_") as tmpdir:
            tex_path = Path(tmpdir) / "document.tex"
            tex_path.write_text(latex_content, encoding="utf-8")

            # Run pdflatex (two passes for references)
            try:
                for _ in range(2):
                    process = subprocess.run(
                        [
                            "pdflatex",
                            "-interaction=nonstopmode",
                            "-shell-escape",
                            "-output-directory",
                            tmpdir,
                            str(tex_path),
                        ],
                        capture_output=True,
                        text=True,
                        timeout=PDFLATEX_TIMEOUT_SECONDS,
                        cwd=tmpdir,
                    )

            except subprocess.TimeoutExpired:
                logger.error(
                    f"pdflatex timeout after {PDFLATEX_TIMEOUT_SECONDS}s "
                    f"for course '{course_name}'"
                )
                raise TimeoutError(
                    f"La compilation LaTeX a dépassé le délai de "
                    f"{PDFLATEX_TIMEOUT_SECONDS} secondes"
                )

            # Check for compilation failure
            pdf_output = Path(tmpdir) / "document.pdf"
            if not pdf_output.exists():
                # Read the .log file for detailed error info
                log_file = Path(tmpdir) / "document.log"
                if log_file.exists():
                    log_content = log_file.read_text(encoding="utf-8", errors="replace")
                    # Extract error lines from the log
                    error_lines = [
                        line for line in log_content.splitlines()
                        if line.startswith("!") or "Error" in line or "Fatal" in line
                    ]
                    error_summary = "\n".join(error_lines[:20]) if error_lines else ""
                    error_log = error_summary or log_content[-COMPILER_ERROR_MAX_CHARS:]
                else:
                    error_log = process.stdout or process.stderr or ""

                error_log_truncated = error_log[:COMPILER_ERROR_MAX_CHARS]
                logger.error(
                    f"pdflatex compilation failed for '{course_name}': "
                    f"{error_log_truncated[:500]}"
                )
                raise RuntimeError(error_log_truncated)

            # Move PDF to storage
            dest_path = STORAGE_DIR / f"{download_id}.pdf"
            shutil.copy2(str(pdf_output), str(dest_path))
            logger.info(
                f"Generated PDF stored at: {dest_path.resolve()} "
                f"(course='{course_name}', audience='{audience}', user='{user_id}')"
            )

        # Create metadata entry
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(hours=PDF_EXPIRATION_HOURS)

        entry = GeneratedPDF(
            download_id=download_id,
            user_id=user_id,
            file_path=str(dest_path.resolve()),
            filename=filename,
            created_at=now,
            expires_at=expires_at,
            course_name=course_name,
            audience=audience,
        )

        # Persist to index
        self._add_to_index(entry)

        logger.info(
            f"PDF compiled: {filename} (id: {download_id}, "
            f"expires: {expires_at.isoformat()})"
        )
        return download_id, filename, expires_at

    def get_pdf(self, download_id: str, user_id: str) -> Tuple[str, str]:
        """
        Retrieve a generated PDF for download.

        Validates ownership and checks expiration.

        Args:
            download_id: UUID of the generated PDF.
            user_id: Authenticated user ID requesting the download.

        Returns:
            Tuple of (file_path, filename).

        Raises:
            FileNotFoundError: If the PDF is expired or not found.
            PermissionError: If the user is not the owner.
        """
        entries = self._read_index()
        entry = None
        for e in entries:
            if e["download_id"] == download_id:
                entry = e
                break

        if entry is None:
            raise FileNotFoundError("Le fichier PDF demandé n'existe pas ou a expiré")

        # Check ownership
        if entry["user_id"] != user_id:
            raise PermissionError(
                "Vous n'êtes pas autorisé à télécharger ce fichier"
            )

        # Check expiration
        expires_at = datetime.fromisoformat(entry["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            # Clean up expired entry
            self._remove_from_index(download_id)
            self._remove_pdf_file(entry["file_path"])
            raise FileNotFoundError(
                "Le fichier PDF a expiré et a été supprimé"
            )

        # Verify file still exists on disk
        if not Path(entry["file_path"]).exists():
            self._remove_from_index(download_id)
            raise FileNotFoundError("Le fichier PDF n'existe plus sur le serveur")

        return entry["file_path"], entry["filename"]

    def list_user_pdfs(self, user_id: str) -> list:
        """
        List all non-expired generated PDFs for a given user.

        Args:
            user_id: Authenticated user ID.

        Returns:
            List of PDF metadata dicts (download_id, filename, course_name,
            audience, created_at, expires_at), sorted newest first.
        """
        entries = self._read_index()
        now = datetime.now(timezone.utc)
        user_pdfs = []

        for entry in entries:
            if entry["user_id"] != user_id:
                continue

            expires_at = datetime.fromisoformat(entry["expires_at"])
            if now > expires_at:
                continue

            # Verify file still exists
            if not Path(entry["file_path"]).exists():
                continue

            user_pdfs.append({
                "download_id": entry["download_id"],
                "filename": entry["filename"],
                "course_name": entry.get("course_name", ""),
                "audience": entry.get("audience", ""),
                "created_at": entry["created_at"],
                "expires_at": entry["expires_at"],
            })

        # Sort by created_at descending (newest first)
        user_pdfs.sort(key=lambda x: x["created_at"], reverse=True)
        return user_pdfs

    def cleanup_expired_pdfs(self) -> int:
        """
        Remove expired PDFs and their metadata entries.

        Returns the number of entries removed.
        """
        entries = self._read_index()
        now = datetime.now(timezone.utc)
        remaining = []
        removed_count = 0

        for entry in entries:
            expires_at = datetime.fromisoformat(entry["expires_at"])
            if now > expires_at:
                # Remove the PDF file
                self._remove_pdf_file(entry["file_path"])
                removed_count += 1
                logger.info(
                    f"Cleaned up expired PDF: {entry['filename']} "
                    f"(id: {entry['download_id']})"
                )
            else:
                remaining.append(entry)

        if removed_count > 0:
            self._write_index(remaining)
            logger.info(f"Cleanup complete: {removed_count} expired PDFs removed")

        return removed_count

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _clean_latex_response(self, content: str) -> str:
        """
        Clean AI response to extract pure LaTeX content.

        AI models often wrap LaTeX in markdown code fences or add explanatory
        text. This method extracts just the LaTeX document.
        """
        import re as _re

        # Strip markdown code fences (```latex ... ``` or ```tex ... ``` or ``` ... ```)
        # Try to find content between code fences first
        fence_pattern = _re.compile(
            r"```(?:latex|tex)?\s*\n(.*?)```",
            _re.DOTALL,
        )
        matches = fence_pattern.findall(content)
        if matches:
            # Use the longest match (likely the full document)
            content = max(matches, key=len)

        # If content has \documentclass, extract from there to \end{document}
        doc_match = _re.search(
            r"(\\documentclass.*?\\end\{document\})",
            content,
            _re.DOTALL,
        )
        if doc_match:
            content = doc_match.group(1)

        return content.strip()

    def _generate_filename(self, course_name: str, audience: str) -> str:
        """
        Generate a sanitized PDF filename.

        Format: {course_name}_{audience}.pdf
        - Special characters and spaces replaced by underscores
        - Total length (including .pdf) truncated to 100 characters
        """
        raw_name = f"{course_name}_{audience}"
        # Replace any non-alphanumeric character (except underscores) with underscore
        sanitized = re.sub(r"[^a-zA-Z0-9_àâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ]", "_", raw_name)
        # Collapse multiple underscores
        sanitized = re.sub(r"_+", "_", sanitized)
        # Strip leading/trailing underscores
        sanitized = sanitized.strip("_")

        # Truncate to max length (accounting for .pdf extension = 4 chars)
        max_base_length = MAX_FILENAME_LENGTH - 4  # Reserve space for ".pdf"
        if len(sanitized) > max_base_length:
            sanitized = sanitized[:max_base_length]

        return f"{sanitized}.pdf"

    def _read_index(self) -> list:
        """Read the metadata index from disk."""
        try:
            if not INDEX_FILE.exists():
                return []
            content = INDEX_FILE.read_text(encoding="utf-8")
            return json.loads(content)
        except (json.JSONDecodeError, OSError) as e:
            logger.error(f"Error reading index file: {e}")
            return []

    def _write_index(self, entries: list) -> None:
        """Write the metadata index to disk."""
        try:
            STORAGE_DIR.mkdir(parents=True, exist_ok=True)
            INDEX_FILE.write_text(
                json.dumps(entries, indent=2, default=str),
                encoding="utf-8",
            )
        except OSError as e:
            logger.error(f"Error writing index file: {e}")

    def _add_to_index(self, entry: GeneratedPDF) -> None:
        """Add a new entry to the metadata index."""
        entries = self._read_index()
        entries.append(
            {
                "download_id": entry.download_id,
                "user_id": entry.user_id,
                "file_path": entry.file_path,
                "filename": entry.filename,
                "created_at": entry.created_at.isoformat(),
                "expires_at": entry.expires_at.isoformat(),
                "course_name": entry.course_name,
                "audience": entry.audience,
            }
        )
        self._write_index(entries)

    def _remove_from_index(self, download_id: str) -> None:
        """Remove an entry from the metadata index by download_id."""
        entries = self._read_index()
        entries = [e for e in entries if e["download_id"] != download_id]
        self._write_index(entries)

    def _remove_pdf_file(self, file_path: str) -> None:
        """Safely remove a PDF file from disk."""
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
        except OSError as e:
            logger.error(f"Error removing PDF file {file_path}: {e}")


# Singleton instance for use by the router
course_service = CourseService()
