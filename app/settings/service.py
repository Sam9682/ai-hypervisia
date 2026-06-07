"""
Application settings service.

Manages runtime-configurable settings stored in a JSON file.
These settings can be modified via the admin UI without restarting the app.
"""

import json
from pathlib import Path
from typing import Any, Dict

from app.logging_config import get_logger

logger = get_logger("settings.service")

SETTINGS_FILE = Path("storage/app_settings.json")

# Default values for all configurable settings
DEFAULTS: Dict[str, Any] = {
    "pdf_ttl_hours": 1,
    "docs_shared_enabled": False,
}


class AppSettingsService:
    """Service for managing runtime application settings."""

    def __init__(self) -> None:
        SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
        if not SETTINGS_FILE.exists():
            self._write(DEFAULTS)

    def get_all(self) -> Dict[str, Any]:
        """Return all settings merged with defaults."""
        stored = self._read()
        merged = {**DEFAULTS, **stored}
        return merged

    def get(self, key: str) -> Any:
        """Get a single setting value."""
        all_settings = self.get_all()
        return all_settings.get(key, DEFAULTS.get(key))

    def update(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update one or more settings. Returns the new full settings dict."""
        current = self._read()
        for key, value in updates.items():
            if key in DEFAULTS:
                current[key] = value
            else:
                logger.warning(f"Ignoring unknown setting key: {key}")
        self._write(current)
        logger.info(f"Settings updated: {updates}")
        return self.get_all()

    def _read(self) -> Dict[str, Any]:
        try:
            if SETTINGS_FILE.exists():
                return json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as e:
            logger.error(f"Error reading settings file: {e}")
        return {}

    def _write(self, data: Dict[str, Any]) -> None:
        try:
            SETTINGS_FILE.write_text(
                json.dumps(data, indent=2), encoding="utf-8"
            )
        except OSError as e:
            logger.error(f"Error writing settings file: {e}")


app_settings_service = AppSettingsService()
